import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista todas as tasks de um usuário (Pro).
   * Importante: sempre filtrar por userId para evitar vazamento de dados.
   */
  findAllByUser(userId: string) {
    return this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Cria uma nova task para o usuário, respeitando o limite de 100 tasks por usuário Pro.
   */
  async createForUser(userId: string, data: CreateTaskDto) {
    const totalTasks = await this.prisma.task.count({
      where: { userId },
    });

    if (totalTasks >= 100) {
      throw new ConflictException(
        'Limite de 100 tarefas atingido para o seu plano Pro.',
      );
    }

    const task = await this.prisma.task.create({
      data: {
        userId,
        title: data.title,
        // no banco o campo é isCompleted, não done
        isCompleted: false,
      },
    });

    return task;
  }

  /**
   * Atualiza uma task pertencente ao usuário.
   * Se a task não for do usuário ou não existir, retorna null.
   */
  async updateForUser(userId: string, taskId: string, updates: UpdateTaskDto) {
    const existing = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!existing) {
      return null;
    }

    const updated = await this.prisma.task.update({
      where: { id: existing.id },
      data: {
        title: updates.title ?? existing.title,
        // mapeia o "done" do DTO para isCompleted do banco
        isCompleted: updates.done ?? existing.isCompleted,
      },
    });

    return updated;
  }

  /**
   * Remove uma task específica do usuário.
   * Não lança erro se não existir (idempotente).
   */
  async removeForUser(userId: string, taskId: string): Promise<void> {
    await this.prisma.task.deleteMany({
      where: {
        id: taskId,
        userId,
      },
    });
  }

  /**
   * Remove todas as tasks do usuário.
   */
  async clearForUser(userId: string): Promise<void> {
    await this.prisma.task.deleteMany({
      where: {
        userId,
      },
    });
  }
}
