import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { UpsertTimerStateDto } from './dto/upsert-timer-state.dto';

@Injectable()
export class TimerStateService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureUserIsPro(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) throw new NotFoundException('User not found.');
    if (user.plan !== 'PRO') {
      throw new ForbiddenException(
        'Timer multi-dispositivo está disponível apenas para usuários Pro.',
      );
    }
  }

  async getTimerState(userId: string) {
    await this.ensureUserIsPro(userId);

    return this.prisma.timerState.findUnique({
      where: { userId },
    });
  }

  async upsertTimerState(userId: string, dto: UpsertTimerStateDto) {
    await this.ensureUserIsPro(userId);

    const lastUpdatedAt = dto.lastUpdatedAt
      ? new Date(dto.lastUpdatedAt)
      : null;
    const lastFinishedAt = dto.lastFinishedAt
      ? new Date(dto.lastFinishedAt)
      : null;
    const clientUpdatedAt = dto.clientUpdatedAt
      ? new Date(dto.clientUpdatedAt)
      : null;

    // Estratégia simples: last-write-wins por clientUpdatedAt (se existir).
    // Se não existir, upsert normal.
    const existing = await this.prisma.timerState.findUnique({
      where: { userId },
    });

    if (existing?.clientUpdatedAt && clientUpdatedAt) {
      if (clientUpdatedAt.getTime() < existing.clientUpdatedAt.getTime()) {
        // Cliente enviou estado mais antigo -> ignorar update
        return existing;
      }
    }

    return this.prisma.timerState.upsert({
      where: { userId },
      create: {
        userId,
        mode: dto.mode,
        remainingSeconds: dto.remainingSeconds,
        isRunning: dto.isRunning,
        lastUpdatedAt,
        completedPomodoros: dto.completedPomodoros,
        lastFinishedAt,
        clientUpdatedAt,
      },
      update: {
        mode: dto.mode,
        remainingSeconds: dto.remainingSeconds,
        isRunning: dto.isRunning,
        lastUpdatedAt,
        completedPomodoros: dto.completedPomodoros,
        lastFinishedAt,
        clientUpdatedAt,
      },
    });
  }
}
