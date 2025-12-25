import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SyncTasksDto } from './dto/sync-tasks.dto';

// Tipagem mínima do “Task” para evitar any/unsafe member access.
// (Não depende de imports do Prisma, reduz acoplamento.)
type TaskShape = {
  id: string;
  clientId: string | null;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

function toTaskResponse(item: TaskShape) {
  return {
    id: item.id,
    clientId: item.clientId,
    title: item.title,
    done: item.isCompleted,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    deletedAt: item.deletedAt ? item.deletedAt.toISOString() : null,
  };
}

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    // O service hoje já retorna Prisma Task[] no sync; aqui vamos usar findMany direto via service.
    const items = await this.tasksService.listForUser(user.id);
    return items.map(toTaskResponse);
  }

  // Criação é sensível a spam
  @Throttle({ default: { limit: 30, ttl: 60 } })
  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTaskDto,
  ) {
    const item = await this.tasksService.createForUser(user.id, dto);
    return toTaskResponse(item as TaskShape);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const item = await this.tasksService.updateForUser(user.id, id, dto);
    return toTaskResponse(item as TaskShape);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.tasksService.removeForUser(user.id, id);
    return { ok: true };
  }

  @Delete()
  async clear(@CurrentUser() user: AuthenticatedUser) {
    await this.tasksService.clearForUser(user.id);
    return { ok: true };
  }

  // Endpoint crítico: alto volume + impacto
  @Throttle({ default: { limit: 20, ttl: 60 } })
  @Post('sync')
  async sync(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SyncTasksDto,
  ) {
    const consolidated = await this.tasksService.syncTasksForUser(user.id, dto);

    return {
      meta: { serverTime: new Date().toISOString() },
      tasks: consolidated.map(toTaskResponse),
    };
  }
}
