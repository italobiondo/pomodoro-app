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
      include: {
        subscriptions: {
          orderBy: { currentPeriodEnd: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const now = new Date();
    const lastSubscription = user.subscriptions[0] ?? null;

    const isPlanActive =
      user.plan === PlanType.PRO &&
      user.planStatus === PlanStatus.ACTIVE &&
      (!user.planExpiresAt || user.planExpiresAt > now);

    return {
      isPro: isPlanActive,
      plan: user.plan,
      planStatus: user.planStatus,
      planExpiresAt: user.planExpiresAt
        ? user.planExpiresAt.toISOString()
        : null,
      subscription: lastSubscription
        ? {
            provider: lastSubscription.provider,
            status: lastSubscription.status,
            currentPeriodStart:
              lastSubscription.currentPeriodStart.toISOString(),
            currentPeriodEnd: lastSubscription.currentPeriodEnd.toISOString(),
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
      await tx.subscription.create({
        data: {
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
