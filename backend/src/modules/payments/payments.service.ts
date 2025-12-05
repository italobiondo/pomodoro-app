import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { PaymentStatus } from '../../generated/prisma/client/client';
import { MercadoPagoWebhookDto } from './dto/mercado-pago-webhook.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { addMonths } from 'date-fns';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Trata o webhook do Mercado Pago (MVP).
   *
   * - Normaliza o status para PaymentStatus (PAID/PENDING/FAILED).
   * - Cria um registro em Payment.
   * - Se pago, ativa/renova a assinatura do usuário.
   */
  async handleMercadoPagoWebhook(dto: MercadoPagoWebhookDto): Promise<void> {
    const paymentStatus = this.mapMercadoPagoStatus(dto.status);

    this.logger.log(
      `Recebido webhook Mercado Pago para userId=${dto.userId} paymentId=${dto.paymentId} status=${dto.status} -> mapped=${paymentStatus}`,
    );

    // Persistência do Payment
    const payment = await this.prisma.payment.create({
      data: {
        userId: dto.userId,
        providerPaymentId: dto.paymentId,
        amount: dto.amountInCents,
        currency: dto.currency,
        status: paymentStatus,
        providerEventType: dto.eventType ?? null,
        rawPayload: dto.rawPayload ?? dto,
      },
    });

    // Se não for pago, não mexe em assinatura
    if (paymentStatus !== PaymentStatus.PAID) {
      this.logger.log(
        `Pagamento não está com status PAID (status=${paymentStatus}), nenhuma assinatura ativada.`,
      );
      return;
    }

    // Para MVP: assume plano mensal a partir de agora.
    const now = new Date();
    const currentPeriodStart = now;
    const currentPeriodEnd = addMonths(now, 1);

    // Criamos uma assinatura genérica vinculada ao usuário.
    // Futuro: usar providerCustomerId/providerSubscriptionId reais do MP.
    await this.subscriptionsService.activateSubscriptionForUser(dto.userId, {
      provider: 'mercado_pago',
      providerCustomerId: dto.userId, // MVP: amarrado ao nosso userId
      providerSubscriptionId: `mp_sub_${payment.id}`,
      currentPeriodStart,
      currentPeriodEnd,
    });
  }

  /**
   * Mapeia status do Mercado Pago (MVP) para nosso enum PaymentStatus.
   */
  private mapMercadoPagoStatus(status: string): PaymentStatus {
    const normalized = status.toLowerCase();

    if (normalized === 'approved') {
      return PaymentStatus.PAID;
    }

    if (normalized === 'pending' || normalized === 'in_process') {
      return PaymentStatus.PENDING;
    }

    // "rejected" / outros
    return PaymentStatus.FAILED;
  }
}
