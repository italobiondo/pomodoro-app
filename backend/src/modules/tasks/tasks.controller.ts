import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ForbiddenException,
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

  /**
   * Verifica se o usuário é Pro.
   * Baseado diretamente no campo `plan` do AuthenticatedUser.
   */
  private assertProUser(user: AuthenticatedUser) {
    // PlanType: 'free' | 'pro'
    if (user.plan !== 'pro') {
      throw new ForbiddenException(
        'Funcionalidade disponível apenas para usuários Pro.',
      );
    }
  }

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    this.assertProUser(user);

    const items = await this.tasksService.findAllByUser(user.id);

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      // mapeia isCompleted (banco) -> done (API)
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
    this.assertProUser(user);

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
    this.assertProUser(user);

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
    this.assertProUser(user);

    await this.tasksService.removeForUser(user.id, id);
    return { success: true };
  }

  @Delete()
  async clear(@CurrentUser() user: AuthenticatedUser) {
    this.assertProUser(user);

    await this.tasksService.clearForUser(user.id);
    return { success: true };
  }

  /**
   * Endpoint preparado para sincronização futura.
   *
   * Por enquanto:
   * - Request body é opcional e não é utilizado.
   * - Continuamos apenas retornando o estado atual das tasks do backend.
   *
   * O DTO SyncTasksDto já define um contrato inicial para futuros recursos de sync
   * (clientId, lastSyncAt, lista de tasks com deletedAt, etc.).
   */
  @Post('sync')
  async sync(
    @CurrentUser() user: AuthenticatedUser,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() _body: SyncTasksDto,
  ) {
    this.assertProUser(user);

    const items = await this.tasksService.findAllByUser(user.id);

    return {
      // meta reservada para futuras versões do protocolo de sync
      meta: {
        serverTime: new Date().toISOString(),
      },
      tasks: items.map((item) => ({
        id: item.id,
        title: item.title,
        done: item.isCompleted,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        // campo reservado para deletar lado-cliente em futuros fluxos de sync
        deletedAt: null,
      })),
    };
  }
}
