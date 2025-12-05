import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import {
  FocusSession,
  StatsSummary,
} from '../../generated/prisma/client/client';

// Tipagem explícita do mock do Prisma que vamos usar nos testes
type PrismaMock = {
  user: {
    findUnique: jest.Mock;
  };
  statsSummary: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
  };
  task: {
    count: jest.Mock;
  };
  focusSession: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    findMany: jest.Mock;
  };
};

describe('StatsService', () => {
  let service: StatsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    const prismaMock: PrismaMock = {
      user: {
        findUnique: jest.fn(),
      },
      statsSummary: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      task: {
        count: jest.fn(),
      },
      focusSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = moduleRef.get<StatsService>(StatsService);
    prisma = prismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve lançar ForbiddenException para usuário FREE em getOverview', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-free',
      plan: 'FREE',
    });

    await expect(service.getOverview('user-free')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('deve criar e finalizar uma FocusSession e chamar upsert de StatsSummary', async () => {
    const userId = 'user-pro';

    // Usuário Pro
    prisma.user.findUnique.mockResolvedValue({
      id: userId,
      plan: 'PRO',
    });

    const startedAt = new Date();

    const createdSession: FocusSession = {
      id: 'session-1',
      userId,
      startedAt,
      endedAt: null,
      focusMinutes: 0,
      breakMinutes: 0,
      createdAt: startedAt,
      updatedAt: startedAt,
    };

    prisma.focusSession.create.mockResolvedValue(createdSession);
    prisma.focusSession.findUnique.mockResolvedValue(createdSession);

    const finishedAt = new Date(startedAt.getTime() + 25 * 60 * 1000);

    const updatedSession: FocusSession = {
      ...createdSession,
      endedAt: finishedAt,
      focusMinutes: 25,
      breakMinutes: 5,
      updatedAt: finishedAt,
    };

    prisma.focusSession.update.mockResolvedValue(updatedSession);

    prisma.statsSummary.upsert.mockResolvedValue({
      id: 'summary-1',
      userId,
      totalPomodorosCompleted: 1,
      totalFocusMinutes: 25,
      totalBreakMinutes: 5,
      lastUpdatedAt: finishedAt,
    } as StatsSummary);

    // Act: start
    const started = await service.startFocusSession(userId, {});
    expect(started.id).toBe('session-1');
    expect(prisma.focusSession.create).toHaveBeenCalledTimes(1);

    // Act: finish
    const finished = await service.finishFocusSession(userId, 'session-1', {
      focusMinutes: 25,
      breakMinutes: 5,
    });

    expect(finished.endedAt).toEqual(finishedAt);
    expect(finished.focusMinutes).toBe(25);
    expect(finished.breakMinutes).toBe(5);

    // Assert: upsert chamado para atualizar o summary
    expect(prisma.statsSummary.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.statsSummary.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId },
      }),
    );
  });

  it('getOverview deve combinar summary, tasks e sessões de hoje corretamente', async () => {
    const userId = 'user-pro';
    const now = new Date();

    // Usuário Pro
    prisma.user.findUnique.mockResolvedValue({
      id: userId,
      plan: 'PRO',
    });

    // Summary global existente
    const summary: StatsSummary = {
      id: 'summary-1',
      userId,
      totalPomodorosCompleted: 3,
      totalFocusMinutes: 75,
      totalBreakMinutes: 15,
      lastUpdatedAt: now,
    };

    prisma.statsSummary.findUnique.mockResolvedValue(summary);

    // Tasks: count já vem pronto do mock
    prisma.task.count.mockResolvedValue(2); // tasksCompletedToday

    // Sessões de foco concluídas hoje
    const sessionsToday: FocusSession[] = [
      {
        id: 'session-1',
        userId,
        startedAt: new Date(now.getTime() - 25 * 60 * 1000),
        endedAt: now,
        focusMinutes: 25,
        breakMinutes: 5,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'session-2',
        userId,
        startedAt: new Date(now.getTime() - 40 * 60 * 1000),
        endedAt: now,
        focusMinutes: 15,
        breakMinutes: 0,
        createdAt: now,
        updatedAt: now,
      },
    ];

    prisma.focusSession.findMany.mockResolvedValue(sessionsToday);

    // Act
    const overview = await service.getOverview(userId);

    // Assert totais (vindos do summary)
    expect(overview.totalPomodorosCompleted).toBe(3);
    expect(overview.totalFocusMinutes).toBe(75);
    expect(overview.totalBreakMinutes).toBe(15);

    // Assert métricas diárias
    expect(overview.tasksCompletedToday).toBe(2);
    expect(overview.pomodorosToday).toBe(2);
    expect(overview.focusMinutesToday).toBe(40); // 25 + 15
  });
});
