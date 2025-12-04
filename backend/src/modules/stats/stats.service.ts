import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { startOfDay } from 'date-fns';
import {
  FocusSession,
  StatsSummary,
} from '../../generated/prisma/client/client';

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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      await this.prisma.focusSession.findMany({
        where: {
          userId,
          endedAt: { gte: today },
        },
      });

    const pomodorosToday = sessionsToday.length;

    const focusMinutesToday = sessionsToday.reduce(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
}
