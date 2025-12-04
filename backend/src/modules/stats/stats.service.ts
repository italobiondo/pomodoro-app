import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { startOfDay } from 'date-fns';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string) {
    const today = startOfDay(new Date());

    // Dados agregados da tabela StatsSummary
    const summary = (await this.prisma.statsSummary.findUnique({
      where: { userId },
    })) ?? {
      totalPomodorosCompleted: 0,
      totalFocusMinutes: 0,
      totalBreakMinutes: 0,
    };

    // Conta tasks concluídas HOJE
    const tasksCompletedToday = await this.prisma.task.count({
      where: {
        userId,
        isCompleted: true,
        completedAt: { gte: today },
      },
    });

    // Sessões concluídas HOJE
    const sessionsToday = await this.prisma.focusSession.findMany({
      where: {
        userId,
        endedAt: { gte: today },
      },
    });

    const pomodorosToday = sessionsToday.length;
    const focusMinutesToday = sessionsToday.reduce(
      (acc, s) => acc + s.focusMinutes,
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
