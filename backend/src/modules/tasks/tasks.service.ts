import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SyncTasksDto } from './dto/sync-tasks.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

const FREE_TASK_LIMIT = 10;
const PRO_TASK_LIMIT = 100;

type TasksLimitErrorPayload = {
  code: 'TASKS_LIMIT_REACHED';
  limit: number;
  current: number;
  requires: 'PRO' | 'FREE_LIMIT';
  message: string;
};

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  private async getActiveLimitForUser(userId: string): Promise<number> {
    const status = await this.subscriptionsService.getStatusForUser(userId);
    return status.isPro ? PRO_TASK_LIMIT : FREE_TASK_LIMIT;
  }

  /**
   * Lista todas as tasks ATIVAS (não deletadas) de um usuário.
   */
  findAllByUser(userId: string) {
    return this.prisma.task.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Conta quantas tasks ativas (não deletadas) o usuário possui.
   */
  private countActiveTasks(userId: string) {
    return this.prisma.task.count({
      where: { userId, deletedAt: null },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Cria uma nova task para o usuário, respeitando:
   * - Pro ativo: 100 tasks ativas
   * - Não-Pro (inclui expirado): 10 tasks ativas
   */
  async createForUser(userId: string, data: CreateTaskDto) {
    const [totalTasks, limit] = await Promise.all([
      this.countActiveTasks(userId),
      this.getActiveLimitForUser(userId),
    ]);

    if (totalTasks >= limit) {
      const payload: TasksLimitErrorPayload = {
        code: 'TASKS_LIMIT_REACHED',
        limit,
        current: totalTasks,
        requires: limit === PRO_TASK_LIMIT ? 'PRO' : 'FREE_LIMIT',
        message:
          limit === FREE_TASK_LIMIT
            ? `Limite de ${FREE_TASK_LIMIT} tarefas atingido no modo Free. Exclua/Finalize tarefas para criar novas, ou reative o Pro para liberar até ${PRO_TASK_LIMIT}.`
            : `Limite de ${PRO_TASK_LIMIT} tarefas atingido no plano Pro.`,
      };

      throw new ConflictException(payload);
    }

    const now = new Date();

    return this.prisma.task.create({
      data: {
        userId,
        title: data.title,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async updateForUser(userId: string, taskId: string, updates: UpdateTaskDto) {
    const existing = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Task não encontrada para este usuário.');
    }

    const now = new Date();

    return this.prisma.task.update({
      where: { id: existing.id },
      data: {
        title:
          typeof updates.title !== 'undefined' ? updates.title : existing.title,
        isCompleted:
          typeof updates.done !== 'undefined'
            ? updates.done
            : existing.isCompleted,
        completedAt:
          typeof updates.done === 'boolean'
            ? updates.done
              ? (existing.completedAt ?? now)
              : null
            : existing.completedAt,
        updatedAt: now,
      },
    });
  }

  async removeForUser(userId: string, taskId: string): Promise<void> {
    const now = new Date();

    await this.prisma.task.updateMany({
      where: {
        id: taskId,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: now,
        updatedAt: now,
      },
    });
  }

  async clearForUser(userId: string): Promise<void> {
    const now = new Date();

    await this.prisma.task.updateMany({
      where: {
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: now,
        updatedAt: now,
      },
    });
  }

  /**
   * Sync:
   * - Sempre permite update/delete (mesmo para expirado)
   * - Só bloqueia caso o sync vá CRIAR tasks ativas acima do limite atual do usuário
   */
  async syncTasksForUser(userId: string, payload: SyncTasksDto) {
    const { tasks: incomingTasks } = payload;

    const [existingTasks, limit] = await Promise.all([
      this.prisma.task.findMany({ where: { userId } }), // inclui deletadas
      this.getActiveLimitForUser(userId),
    ]);

    const byId = new Map(existingTasks.map((t) => [t.id, t]));
    const byClientId = new Map(
      existingTasks
        .filter((t) => t.clientId)
        .map((t) => [t.clientId as string, t]),
    );

    const currentActiveCount = existingTasks.filter((t) => !t.deletedAt).length;

    const potentialNewActiveCount = incomingTasks.filter((incoming) => {
      const serverTaskById = incoming.id ? byId.get(incoming.id) : undefined;
      const serverTaskByClientId = incoming.clientId
        ? byClientId.get(incoming.clientId)
        : undefined;
      const serverTask = serverTaskById ?? serverTaskByClientId;

      const hasDeletedAt = !!incoming.deletedAt;
      return !serverTask && !hasDeletedAt;
    }).length;

    if (currentActiveCount + potentialNewActiveCount > limit) {
      const payload: TasksLimitErrorPayload = {
        code: 'TASKS_LIMIT_REACHED',
        limit,
        current: currentActiveCount,
        requires: limit === FREE_TASK_LIMIT ? 'FREE_LIMIT' : 'PRO',
        message:
          limit === FREE_TASK_LIMIT
            ? `Sincronização excede o limite Free (${FREE_TASK_LIMIT}). Você pode excluir/concluir tarefas para reduzir, ou reativar o Pro para liberar até ${PRO_TASK_LIMIT}.`
            : `Sincronização excede o limite Pro (${PRO_TASK_LIMIT}).`,
      };
      throw new ConflictException(payload);
    }

    const now = new Date();

    for (const incoming of incomingTasks) {
      const serverTaskById = incoming.id ? byId.get(incoming.id) : undefined;
      const serverTaskByClientId = incoming.clientId
        ? byClientId.get(incoming.clientId)
        : undefined;
      const serverTask = serverTaskById ?? serverTaskByClientId;

      const incomingUpdatedAt = incoming.updatedAt
        ? new Date(incoming.updatedAt)
        : null;
      const incomingDeletedAt = incoming.deletedAt
        ? new Date(incoming.deletedAt)
        : null;

      if (!serverTask) {
        if (incomingDeletedAt) continue;

        const created = await this.prisma.task.create({
          data: {
            userId,
            title: incoming.title,
            isCompleted: incoming.done,
            completedAt: incoming.done ? now : null,
            clientId: incoming.clientId ?? null,
            createdAt: now,
            updatedAt: incomingUpdatedAt ?? now,
            deletedAt: null,
          },
        });

        byId.set(created.id, created);
        if (created.clientId) byClientId.set(created.clientId, created);
        continue;
      }

      if (incomingUpdatedAt && serverTask.updatedAt) {
        if (incomingUpdatedAt < serverTask.updatedAt) continue;
      }

      if (incomingDeletedAt) {
        const updated = await this.prisma.task.update({
          where: { id: serverTask.id },
          data: {
            deletedAt: incomingDeletedAt,
            updatedAt: incomingUpdatedAt ?? now,
            clientId: incoming.clientId ?? serverTask.clientId,
          },
        });

        byId.set(updated.id, updated);
        if (updated.clientId) byClientId.set(updated.clientId, updated);
        continue;
      }

      const updated = await this.prisma.task.update({
        where: { id: serverTask.id },
        data: {
          title: incoming.title ?? serverTask.title,
          isCompleted:
            typeof incoming.done === 'boolean'
              ? incoming.done
              : serverTask.isCompleted,
          completedAt:
            typeof incoming.done === 'boolean'
              ? incoming.done
                ? (serverTask.completedAt ?? now)
                : null
              : serverTask.completedAt,
          clientId: incoming.clientId ?? serverTask.clientId,
          updatedAt: incomingUpdatedAt ?? now,
        },
      });

      byId.set(updated.id, updated);
      if (updated.clientId) byClientId.set(updated.clientId, updated);
    }

    return this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
