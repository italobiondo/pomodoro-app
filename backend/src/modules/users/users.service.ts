import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  // MVP: guarda em memória. Depois você troca isso por Prisma/TypeORM.
  private users: User[] = [];

  findByProvider(
    provider: 'google' | 'apple',
    providerId: string,
  ): Promise<User | null> {
    const user =
      this.users.find(
        (u) => u.provider === provider && u.providerId === providerId,
      ) || null;

    return Promise.resolve(user);
  }

  findById(id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id) || null;
    return Promise.resolve(user);
  }

  async findOrCreateSocialUser(params: {
    provider: 'google' | 'apple';
    providerId: string;
    email: string;
    name?: string | null;
  }): Promise<User> {
    const existing = await this.findByProvider(
      params.provider,
      params.providerId,
    );

    if (existing) {
      // Atualiza dados básicos se necessário
      existing.email = params.email;
      existing.name = params.name ?? existing.name ?? null;
      existing.updatedAt = new Date();
      return existing;
    }

    const now = new Date();
    const user: User = {
      id: randomUUID(),
      email: params.email,
      name: params.name ?? null,
      provider: params.provider,
      providerId: params.providerId,
      plan: 'free', // pagamento vem em outra sprint
      planExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.users.push(user);
    return user;
  }
}
