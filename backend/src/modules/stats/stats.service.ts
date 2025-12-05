import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { startOfDay } from 'date-fns';
import {
  FocusSession,
  StatsSummary,
} from '../../generated/prisma/client/client';
import { StartFocusSessionDto } from './dto/start-focus-session.dto';
import { FinishFocusSessionDto } from './dto/finish-focus-session.dto';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string) {
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
  async startFocusSession(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _dto: StartFocusSessionDto,
  ): Promise<FocusSession> {
    // Por enquanto, ignoramos os campos de planned* (só útil no futuro).
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

  async finishFocusSession(
    userId: string,
    sessionId: string,
    dto: FinishFocusSessionDto,
  ): Promise<FocusSession> {
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
