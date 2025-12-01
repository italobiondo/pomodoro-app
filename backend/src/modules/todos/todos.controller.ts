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
import { TodosService } from './todos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import type { AuthenticatedUser } from '../auth/auth.types';

interface CreateTodoBody {
  title: string;
}

interface UpdateTodoBody {
  title?: string;
  done?: boolean;
}

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    const items = await this.todosService.findAllByUser(user.id);

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      done: item.done,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateTodoBody,
  ) {
    const title = body.title ?? '';
    const item = await this.todosService.createForUser(user.id, title);

    return {
      id: item.id,
      title: item.title,
      done: item.done,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateTodoBody,
  ) {
    const updated = await this.todosService.updateForUser(user.id, id, {
      title: body.title,
      done: body.done,
    });

    if (!updated) {
      return null;
    }

    return {
      id: updated.id,
      title: updated.title,
      done: updated.done,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.todosService.removeForUser(user.id, id);
    return { success: true };
  }

  @Delete()
  async clear(@CurrentUser() user: AuthenticatedUser) {
    await this.todosService.clearForUser(user.id);
    return { success: true };
  }
}
