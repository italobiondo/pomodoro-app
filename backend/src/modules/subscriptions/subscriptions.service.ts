import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import {
  PlanStatus,
  PlanType,
  SubscriptionStatus,
} from '../../generated/prisma/client/client';
import {
  ActivateSubscriptionInput,
  SubscriptionStatusResponseDto,
} from './dto/subscription-status-response.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna o status de assinatura / plano do usuário.
   */
  async getStatusForUser(
    userId: string,
  ): Promise<SubscriptionStatusResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const now = new Date();

    // Assinatura canônica (Mercado Pago): 1 por usuário
    const canonicalProvider = 'mercado_pago';
    const canonicalProviderSubscriptionId = `mp_sub_user_${userId}`;

    const canonicalSubscription = await this.prisma.subscription.findUnique({
      where: {
        provider_providerSubscriptionId: {
          provider: canonicalProvider,
          providerSubscriptionId: canonicalProviderSubscriptionId,
        },
      },
    });

    // Fallback: última assinatura (qualquer provider), por segurança
    const lastSubscription = await this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { currentPeriodEnd: 'desc' },
    });

    const subscription = canonicalSubscription ?? lastSubscription;

    const isProFromSubscription =
      !!subscription &&
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.currentPeriodEnd > now;

    // Fonte de verdade:
    // - se existe subscription (canônica ou fallback), ela manda
    // - se não existe, cai no estado do User (permite “PRO manual” no futuro)
    const isProEffective =
      subscription !== null && subscription !== undefined
        ? isProFromSubscription
        : user.plan === PlanType.PRO &&
          user.planStatus === PlanStatus.ACTIVE &&
          (!user.planExpiresAt || user.planExpiresAt > now);

    return {
      isPro: isProEffective,
      plan: user.plan,
      planStatus: user.planStatus,
      planExpiresAt: user.planExpiresAt
        ? user.planExpiresAt.toISOString()
        : null,
      subscription: subscription
        ? {
            provider: subscription.provider,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart.toISOString(),
            currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
          }
        : null,
    };
  }

  /**
   * Ativa (ou renova) uma assinatura para o usuário.
   * MVP: cria sempre uma nova Subscription ligada ao usuário.
   */
  async activateSubscriptionForUser(
    userId: string,
    input: ActivateSubscriptionInput,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.upsert({
        where: {
          provider_providerSubscriptionId: {
            provider: input.provider,
            providerSubscriptionId: input.providerSubscriptionId,
          },
        },
        update: {
          userId: user.id,
          providerCustomerId: input.providerCustomerId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: input.currentPeriodStart,
          currentPeriodEnd: input.currentPeriodEnd,
        },
        create: {
          userId: user.id,
          provider: input.provider,
          providerCustomerId: input.providerCustomerId,
          providerSubscriptionId: input.providerSubscriptionId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: input.currentPeriodStart,
          currentPeriodEnd: input.currentPeriodEnd,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          plan: PlanType.PRO,
          planStatus: PlanStatus.ACTIVE,
          planExpiresAt: input.currentPeriodEnd,
        },
      });
    });
  }
}
