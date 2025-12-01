import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Todo } from './todo.entity';

@Injectable()
export class TodosService {
  // Armazena os todos por usuário (MVP em memória)
  private readonly todosByUser = new Map<string, Todo[]>();

  findAllByUser(userId: string): Promise<Todo[]> {
    const items = this.todosByUser.get(userId) ?? [];
    return Promise.resolve(items);
  }

  createForUser(userId: string, title: string): Promise<Todo> {
    const now = new Date();

    const todo: Todo = {
      id: randomUUID(),
      userId,
      title,
      done: false,
      createdAt: now,
      updatedAt: now,
    };

    const current = this.todosByUser.get(userId) ?? [];
    this.todosByUser.set(userId, [...current, todo]);

    return Promise.resolve(todo);
  }

  updateForUser(
    userId: string,
    id: string,
    updates: { title?: string; done?: boolean },
  ): Promise<Todo | null> {
    const list = this.todosByUser.get(userId) ?? [];
    let updated: Todo | null = null;

    const newList = list.map((item) => {
      if (item.id !== id) {
        return item;
      }

      updated = {
        ...item,
        title: updates.title ?? item.title,
        done: updates.done ?? item.done,
        updatedAt: new Date(),
      };

      return updated;
    });

    this.todosByUser.set(userId, newList);

    return Promise.resolve(updated);
  }

  removeForUser(userId: string, id: string): Promise<void> {
    const list = this.todosByUser.get(userId) ?? [];
    const filtered = list.filter((item) => item.id !== id);
    this.todosByUser.set(userId, filtered);
    return Promise.resolve(undefined);
  }

  clearForUser(userId: string): Promise<void> {
    this.todosByUser.set(userId, []);
    return Promise.resolve(undefined);
  }
}
