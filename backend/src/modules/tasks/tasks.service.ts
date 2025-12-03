import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SyncTasksDto } from './dto/sync-tasks.dto';

const MAX_TASKS_PER_USER = 100;

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista todas as tasks ATIVAS (não deletadas) de um usuário (Pro).
   * Importante: sempre filtrar por userId e deletedAt: null.
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

  /**
   * Cria uma nova task para o usuário, respeitando o limite de 100 tasks por usuário Pro.
   */
  async createForUser(userId: string, data: CreateTaskDto) {
    const totalTasks = await this.countActiveTasks(userId);

    if (totalTasks >= MAX_TASKS_PER_USER) {
      throw new ConflictException(
        `Limite de ${MAX_TASKS_PER_USER} tarefas atingido para o seu plano Pro.`,
      );
    }

    const now = new Date();

    const task = await this.prisma.task.create({
      data: {
        userId,
        title: data.title, // já validado no DTO
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      },
    });

    return task;
  }

  /**
   * Atualiza uma task pertencente ao usuário.
   * Se a task não for do usuário ou não existir, lança NotFoundException.
   */
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

    const updated = await this.prisma.task.update({
      where: { id: existing.id },
      data: {
        title:
          typeof updates.title !== 'undefined' ? updates.title : existing.title,
        // mapeia o "done" do DTO para isCompleted do banco
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

    return updated;
  }

  /**
   * Remove (soft delete) uma task específica do usuário.
   * Não lança erro se não existir (idempotente).
   */
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

  /**
   * Remove (soft delete) todas as tasks do usuário.
   */
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
   * Aplica a lógica de sincronização de tasks para um usuário Pro.
   *
   * Estratégia:
   * - Carrega todas as tasks do usuário (incluindo deletadas).
   * - Para cada task enviada pelo client:
   *   - Tenta casar por id (server) ou clientId.
   *   - Resolve conflitos usando updatedAt (se client < server, server vence).
   *   - Se não existe no server e não está deletada -> cria nova.
   *   - Se está deletada -> marca deletedAt no server.
   * - Respeita o limite de 100 tasks ativas por usuário.
   *
   * Retorna o estado consolidado das tasks (incluindo deletadas) para o client.
   */
  async syncTasksForUser(userId: string, payload: SyncTasksDto) {
    const { tasks: incomingTasks } = payload;

    // Carrega todas as tasks do usuário (incluindo deletadas) para ter visão completa.
    const existingTasks = await this.prisma.task.findMany({
      where: { userId },
    });

    const byId = new Map(existingTasks.map((t) => [t.id, t]));
    const byClientId = new Map(
      existingTasks
        .filter((t) => t.clientId)
        .map((t) => [t.clientId as string, t]),
    );

    // Primeiro, calcula quantas novas tasks ativas seriam criadas, para respeitar o limite.
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

    if (currentActiveCount + potentialNewActiveCount > MAX_TASKS_PER_USER) {
      throw new ConflictException(
        `Sincronização criaria mais de ${MAX_TASKS_PER_USER} tarefas ativas. Apague algumas tarefas antes de continuar.`,
      );
    }

    // Agora, aplica as mudanças.
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

      // Se não existe no servidor ainda
      if (!serverTask) {
        // Se chegou como deletada, ignoramos (tombstone só do client).
        if (incomingDeletedAt) {
          continue;
        }

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

        // Atualiza caches locais para próximos itens (se houverem duplicados)
        byId.set(created.id, created);
        if (created.clientId) {
          byClientId.set(created.clientId, created);
        }

        continue;
      }

      // Já existe no servidor: resolver conflito por updatedAt.
      if (incomingUpdatedAt && serverTask.updatedAt) {
        const clientIsOlder = incomingUpdatedAt < serverTask.updatedAt;
        if (clientIsOlder) {
          // Servidor é mais novo -> ignora mudança do client.
          continue;
        }
      }

      // Se incoming indica deleção, marca soft delete.
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
        if (updated.clientId) {
          byClientId.set(updated.clientId, updated);
        }
        continue;
      }

      // Atualização "normal" de conteúdo
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
      if (updated.clientId) {
        byClientId.set(updated.clientId, updated);
      }
    }

    // Retorna o estado consolidado após aplicar todas as mudanças.
    const consolidatedTasks = await this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return consolidatedTasks;
  }
}
