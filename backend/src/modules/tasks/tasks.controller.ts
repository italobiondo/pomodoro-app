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
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { SyncTasksDto } from './dto/sync-tasks.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    const items = await this.tasksService.findAllByUser(user.id);

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      done: item.isCompleted,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateTaskDto,
  ) {
    const item = await this.tasksService.createForUser(user.id, body);

    return {
      id: item.id,
      title: item.title,
      done: item.isCompleted,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateTaskDto,
  ) {
    const updated = await this.tasksService.updateForUser(user.id, id, body);

    return {
      id: updated.id,
      title: updated.title,
      done: updated.isCompleted,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.tasksService.removeForUser(user.id, id);
    return { success: true };
  }

  @Delete()
  async clear(@CurrentUser() user: AuthenticatedUser) {
    await this.tasksService.clearForUser(user.id);
    return { success: true };
  }

  @Post('sync')
  async sync(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SyncTasksDto,
  ) {
    const consolidated = await this.tasksService.syncTasksForUser(
      user.id,
      body,
    );

    return {
      meta: {
        serverTime: new Date().toISOString(),
      },
      tasks: consolidated.map((item) => ({
        id: item.id,
        clientId: item.clientId,
        title: item.title,
        done: item.isCompleted,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        deletedAt: item.deletedAt ? item.deletedAt.toISOString() : null,
      })),
    };
  }
}
