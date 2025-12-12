import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { startOfDay } from 'date-fns';
import {
  FocusSession,
  StatsSummary,
  FocusSessionEventType,
  Prisma,
} from '../../generated/prisma/client/client';
import { StartFocusSessionDto } from './dto/start-focus-session.dto';
import { FinishFocusSessionDto } from './dto/finish-focus-session.dto';
import { CreateFocusSessionEventDto } from './dto/create-focus-session-event.dto';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Garante que o usuário é Pro (plan === 'PRO').
   * Caso contrário, lança ForbiddenException.
   */
  private async ensureUserIsPro(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // PlanType no Prisma: FREE | PRO
    if (user.plan !== 'PRO') {
      throw new ForbiddenException(
        'Estatísticas de foco estão disponíveis apenas para usuários Pro.',
      );
    }
  }

  /**
   * Retorna o overview de estatísticas do usuário (totais + hoje).
   * Agora só permite usuário Pro.
   */
  async getOverview(userId: string) {
    await this.ensureUserIsPro(userId);

    const today = startOfDay(new Date());

    // 🔹 Carrega o summary (com tipo explícito)
    const summaryRecord: StatsSummary | null =
      await this.prisma.statsSummary.findUnique({
        where: { userId },
      });

    const summary: Pick<
      StatsSummary,
      'totalPomodorosCompleted' | 'totalFocusMinutes' | 'totalBreakMinutes'
    > = summaryRecord ?? {
      totalPomodorosCompleted: 0,
      totalFocusMinutes: 0,
      totalBreakMinutes: 0,
    };

    // 🔹 Conta tasks concluídas HOJE
    const tasksCompletedToday = await this.prisma.task.count({
      where: {
        userId,
        isCompleted: true,
        completedAt: { gte: today },
      },
    });

    // 🔹 Sessões concluídas HOJE (tipando o array explicitamente)
    const sessionsToday: FocusSession[] =
      await this.prisma.focusSession.findMany({
        where: {
          userId,
          endedAt: { gte: today },
        },
      });

    const pomodorosToday = sessionsToday.length;

    const focusMinutesToday = sessionsToday.reduce(
      (acc: number, session: FocusSession) => acc + session.focusMinutes,
      0,
    );

    return {
      totalPomodorosCompleted: summary.totalPomodorosCompleted,
      totalFocusMinutes: summary.totalFocusMinutes,
      totalBreakMinutes: summary.totalBreakMinutes,
      tasksCompletedToday,
      pomodorosToday,
      focusMinutesToday,
    };
  }

  /**
   * Inicia uma nova sessão de foco para o usuário Pro.
   * Cria o registro em FocusSession com startedAt = now.
   */
  async startFocusSession(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _dto: StartFocusSessionDto,
  ): Promise<FocusSession> {
    await this.ensureUserIsPro(userId);

    const now = new Date();

    const session = await this.prisma.focusSession.create({
      data: {
        userId,
        startedAt: now,
        // focusMinutes e breakMinutes começam em 0
        // endedAt permanece null até o finish
      },
    });

    return session;
  }

  /**
   * Finaliza uma sessão de foco, calcula os minutos e atualiza o StatsSummary.
   */
  async finishFocusSession(
    userId: string,
    sessionId: string,
    dto: FinishFocusSessionDto,
  ): Promise<FocusSession> {
    await this.ensureUserIsPro(userId);

    const session = await this.prisma.focusSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Focus session not found for this user.');
    }

    if (session.endedAt) {
      throw new BadRequestException('Focus session is already finished.');
    }

    // Determina o endedAt
    const endedAt = dto.endedAt ? new Date(dto.endedAt) : new Date();

    // Calcula focusMinutes se não for enviado
    let focusMinutes = dto.focusMinutes;
    if (focusMinutes === undefined || focusMinutes === null) {
      const diffMs = endedAt.getTime() - session.startedAt.getTime();
      const calculated = Math.round(diffMs / 60000); // arredonda p/ minuto
      focusMinutes = calculated > 0 ? calculated : 0;
    }

    const breakMinutes = dto.breakMinutes ?? 0;

    const updatedSession = await this.prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        endedAt,
        focusMinutes,
        breakMinutes,
      },
    });

    // Atualiza o StatsSummary agregado
    await this.updateStatsSummaryFromSession(userId, updatedSession);

    return updatedSession;
  }

  /**
   * ✅ NOVO: registra eventos finos ligados a uma sessão (somente Pro)
   * - valida se a sessão pertence ao usuário
   * - grava FocusSessionEvent no banco
   */
  async addFocusSessionEvent(
    userId: string,
    sessionId: string,
    dto: CreateFocusSessionEventDto,
  ): Promise<void> {
    await this.ensureUserIsPro(userId);

    const session = await this.prisma.focusSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Focus session not found for this user.');
    }

    // Garantia extra: só aceitar os eventos do escopo mínimo definido
    const allowed: FocusSessionEventType[] = [
      FocusSessionEventType.POMODORO_FINISHED,
      FocusSessionEventType.CYCLE_SKIPPED,
      FocusSessionEventType.BREAK_SKIPPED,
      FocusSessionEventType.RESET_CURRENT,
    ];

    if (!allowed.includes(dto.type)) {
      throw new BadRequestException('Event type not allowed in current scope.');
    }

    await this.prisma.focusSessionEvent.create({
      data: {
        userId,
        focusSessionId: sessionId,
        type: dto.type,
        metadata: dto.metadata
          ? (dto.metadata as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });
  }

  /**
   * Atualiza (ou cria) o StatsSummary agregando os valores da sessão concluída.
   */
  private async updateStatsSummaryFromSession(
    userId: string,
    session: FocusSession,
  ): Promise<void> {
    // Garantia: só chamamos esse método com endedAt != null
    if (!session.endedAt) {
      return;
    }

    await this.prisma.statsSummary.upsert({
      where: { userId },
      create: {
        userId,
        totalPomodorosCompleted: 1,
        totalFocusMinutes: session.focusMinutes,
        totalBreakMinutes: session.breakMinutes,
        lastUpdatedAt: new Date(),
      },
      update: {
        totalPomodorosCompleted: {
          increment: 1,
        },
        totalFocusMinutes: {
          increment: session.focusMinutes,
        },
        totalBreakMinutes: {
          increment: session.breakMinutes,
        },
        lastUpdatedAt: new Date(),
      },
    });
  }
}
