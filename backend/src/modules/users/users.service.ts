import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';

type SocialProvider = 'google' | 'apple';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Converte o provider vindo do Google/Apple para o valor esperado
   * pelo enum AuthProvider do Prisma (provavelmente "GOOGLE"/"APPLE").
   */
  private mapProviderToAuthProviderEnum(provider: SocialProvider): string {
    switch (provider) {
      case 'google':
        return 'GOOGLE';
      case 'apple':
        return 'APPLE';
      default:
        // fallback defensivo – evita quebrar se aparecer outro
        return (provider as string).toUpperCase();
    }
  }

  findByProvider(provider: SocialProvider, providerId: string) {
    const authProvider = this.mapProviderToAuthProviderEnum(provider);

    return this.prisma.user.findFirst({
      where: {
        authProvider: authProvider as any,
        authProviderId: providerId,
      } as any,
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Cria ou atualiza usuário social persistindo no banco.
   */
  async findOrCreateSocialUser(params: {
    provider: SocialProvider;
    providerId: string;
    email: string;
    name?: string | null;
  }) {
    const authProvider = this.mapProviderToAuthProviderEnum(params.provider);
    const existing = await this.prisma.user.findFirst({
      where: {
        authProvider: authProvider as any,
        authProviderId: params.providerId,
      } as any,
    });

    const isItalo = params.email === 'italo.a.biondo@gmail.com';
    const planValue = (isItalo ? 'PRO' : 'FREE') as any; // enum PlanType do Prisma

    if (existing) {
      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          email: params.email,
          name: params.name ?? existing.name ?? null,
          plan: planValue,
        } as any,
      });
    }

    return this.prisma.user.create({
      data: {
        email: params.email,
        name: params.name ?? null,
        authProvider, // "GOOGLE"/"APPLE"
        authProviderId: params.providerId,
        plan: planValue, // "PRO"/"FREE"
        planExpiresAt: null,
      } as any,
    });
  }
}
