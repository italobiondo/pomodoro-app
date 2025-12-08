import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { PaymentStatus } from '../../generated/prisma/client/client';
import { MercadoPagoWebhookDto } from './dto/mercado-pago-webhook.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { addMonths } from 'date-fns';
import { CreateMercadoPagoPreferenceResponseDto } from './dto/create-mercado-pago-preference-response.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Cria uma preferência de checkout no Mercado Pago para o usuário.
   *
   * - Usa MERCADO_PAGO_ACCESS_TOKEN do ambiente.
   * - Usa FRONTEND_URL para montar os back_urls de retorno.
   * - Retorna o init_point para redirecionar o usuário.
   */
  async createMercadoPagoPreference(
    userId: string,
  ): Promise<CreateMercadoPagoPreferenceResponseDto> {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

    if (!accessToken) {
      this.logger.error(
        'MERCADO_PAGO_ACCESS_TOKEN não está configurado nas variáveis de ambiente',
      );
      throw new InternalServerErrorException(
        'Configuração de pagamento indisponível',
      );
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const fetchFn = (globalThis as any).fetch as
      | ((
          input: string,
          init?: {
            method?: string;
            headers?: Record<string, string>;
            body?: string;
          },
        ) => Promise<Response>)
      | undefined;

    if (!fetchFn) {
      this.logger.error('fetch não está disponível no ambiente Node.js');
      throw new InternalServerErrorException(
        'Ambiente de execução inválido para integração de pagamento',
      );
    }

    const body = {
      items: [
        {
          title: 'Pomodoro Pro - Plano Mensal',
          quantity: 1,
          unit_price: 19.9,
          currency_id: 'BRL',
        },
      ],
      // Metadata é fundamental para o webhook saber de qual usuário é o pagamento
      metadata: {
        userId,
        plan: 'PRO_MONTHLY',
      },
      back_urls: {
        success: `${frontendUrl}/pro/success`,
        failure: `${frontendUrl}/pro/error`,
        pending: `${frontendUrl}/pro/error`,
      },
      auto_return: 'approved',
      external_reference: `user_${userId}_${Date.now()}`,
    };

    let response: Response;

    try {
      response = await fetchFn(
        'https://api.mercadopago.com/checkout/preferences',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
    } catch (error) {
      this.logger.error(
        `Erro ao chamar API do Mercado Pago (create preference): ${String(
          (error as Error).message,
        )}`,
      );
      throw new InternalServerErrorException(
        'Não foi possível iniciar o pagamento no momento',
      );
    }

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(
        `Resposta não OK do Mercado Pago (status=${response.status}): ${text}`,
      );
      throw new InternalServerErrorException(
        'Não foi possível iniciar o pagamento no momento',
      );
    }

    const data = (await response.json()) as {
      init_point?: string;
      sandbox_init_point?: string;
      id?: string;
    };

    const initPoint = data.init_point ?? data.sandbox_init_point;

    if (!initPoint) {
      this.logger.error(
        `Resposta do Mercado Pago não contém init_point. Payload: ${JSON.stringify(
          data,
        )}`,
      );
      throw new InternalServerErrorException(
        'Não foi possível iniciar o pagamento no momento',
      );
    }

    this.logger.log(
      `Preference criada no Mercado Pago para userId=${userId} preferenceId=${data.id} initPoint=${initPoint}`,
    );

    return { init_point: initPoint };
  }

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
