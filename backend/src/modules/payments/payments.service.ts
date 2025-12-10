import {
  DEFAULT_PUBLIC_PRO_PLAN_ID,
  getPlanById,
} from '../../config/plans.config';
import {
  Injectable,
  Logger,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { PaymentStatus } from '../../generated/prisma/client/client';
import { MercadoPagoWebhookDto } from './dto/mercado-pago-webhook.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { addMonths } from 'date-fns';
import { CreateMercadoPagoPreferenceResponseDto } from './dto/create-mercado-pago-preference-response.dto';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Recupera um header de forma case-insensitive.
   */
  private getHeaderValue(
    headers: Record<string, string | string[]> | undefined,
    name: string,
  ): string | undefined {
    if (!headers) {
      return undefined;
    }

    const target = name.toLowerCase();

    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === target) {
        if (Array.isArray(value)) {
          return value[0];
        }
        return value;
      }
    }

    return undefined;
  }

  /**
   * Valida a assinatura HMAC do webhook do Mercado Pago.
   *
   * Especificação:
   * - Header: x-signature (ex: "ts=123456789,v1=abcdef...")
   * - Header: x-request-id
   * - Manifesto: "id:{paymentId};request-id:{x-request-id};ts:{ts};"
   * - HMAC-SHA256 em hex usando MERCADO_PAGO_WEBHOOK_SECRET.
   *
   * Somente é OBRIGATÓRIO em produção.
   * Em outros ambientes, apenas loga e permite seguir.
   */
  private validateMercadoPagoSignature(
    dto: MercadoPagoWebhookDto,
    headers?: Record<string, string | string[]>,
  ): void {
    const appEnv = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development';
    const isProduction = appEnv === 'production';
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

    // Ambientes não produtivos: não bloqueiam, apenas logam
    if (!isProduction) {
      this.logger.warn(
        `Webhook Mercado Pago recebido em ambiente "${appEnv}" sem validação estrita de assinatura (apenas log).`,
      );
      return;
    }

    if (!secret) {
      this.logger.error(
        'MERCADO_PAGO_WEBHOOK_SECRET não está configurada em produção. Webhook será rejeitado.',
      );
      throw new InternalServerErrorException(
        'Configuração de segurança do webhook indisponível',
      );
    }

    if (!headers) {
      throw new UnauthorizedException(
        'Cabeçalhos ausentes no webhook do Mercado Pago.',
      );
    }

    // Alguns docs antigos usam X-MP-Signature; a doc nova usa x-signature.
    const signatureHeader =
      this.getHeaderValue(headers, 'x-signature') ??
      this.getHeaderValue(headers, 'x-mp-signature');

    const requestId = this.getHeaderValue(headers, 'x-request-id');

    if (!signatureHeader || !requestId) {
      throw new UnauthorizedException(
        'Cabeçalhos de assinatura ausentes (x-signature/x-request-id).',
      );
    }

    // Ex: "ts=123456789,v1=abcdef..." (pode vir com espaço após vírgula)
    const parts = signatureHeader.split(',');
    let ts: string | undefined;
    let hash: string | undefined;

    for (const part of parts) {
      const [key, value] = part.split('=').map((p) => p.trim());
      if (key === 'ts') {
        ts = value;
      } else if (key === 'v1') {
        hash = value;
      }
    }

    if (!ts || !hash) {
      throw new UnauthorizedException(
        'Formato inválido do header x-signature (esperado: ts=... , v1=...).',
      );
    }

    const resourceId = dto.paymentId ? String(dto.paymentId) : undefined;

    if (!resourceId) {
      this.logger.warn(
        'Webhook Mercado Pago recebido sem paymentId no DTO. Requisição rejeitada.',
      );
      throw new UnauthorizedException('Webhook inválido (sem paymentId).');
    }

    const manifest = `id:${resourceId};request-id:${requestId};ts:${ts};`;

    const expectedHash = createHmac('sha256', secret)
      .update(manifest)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedHash, 'utf8');
    const receivedBuf = Buffer.from(hash, 'utf8');

    const isValid =
      expectedBuf.length === receivedBuf.length &&
      timingSafeEqual(expectedBuf, receivedBuf);

    if (!isValid) {
      this.logger.warn(
        `Assinatura HMAC inválida no webhook Mercado Pago (paymentId=${resourceId}, requestId=${requestId}).`,
      );
      throw new UnauthorizedException('Assinatura HMAC inválida no webhook.');
    }

    this.logger.log(
      `Assinatura HMAC do webhook Mercado Pago validada com sucesso (paymentId=${resourceId}, requestId=${requestId}).`,
    );
  }

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    /**
     * Para o MVP, usamos sempre o plano Pro Mensal padrão definido no catálogo.
     * No futuro, podemos aceitar um planId vindo do frontend.
     */
    const planId = DEFAULT_PUBLIC_PRO_PLAN_ID;
    const plan = getPlanById(planId);

    if (!plan) {
      this.logger.error(
        `Plano de assinatura não encontrado para id=${planId}. Verifique backend/src/config/plans.config.ts.`,
      );
      throw new InternalServerErrorException(
        'Plano de assinatura indisponível no momento',
      );
    }

    const body = {
      items: [
        {
          title: plan.name,
          quantity: 1,
          unit_price: plan.price,
          currency_id: plan.currency,
        },
      ],
      // Metadata é fundamental para o webhook saber de qual usuário
      // e de qual plano é o pagamento.
      metadata: {
        userId,
        planId: plan.id,
        planType: plan.type,
      },
      // IMPORTANTE:
      // Não enviamos back_urls/auto_return em ambiente de desenvolvimento/local
      // porque o Mercado Pago passou a bloquear URLs HTTP na Preference API.
      // Em produção, com domínio HTTPS, podemos reativar:
      // back_urls: {
      //   success: `${frontendUrl}/pro/success`,
      //   failure: `${frontendUrl}/pro/error`,
      //   pending: `${frontendUrl}/pro/error`,
      // },
      // auto_return: 'approved',
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
      `Preference criada no Mercado Pago para userId=${userId} preferenceId=${data.id} initPoint=${initPoint} plan=${plan.id}`,
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
  async handleMercadoPagoWebhook(
    dto: MercadoPagoWebhookDto,
    headers?: Record<string, string | string[]>,
  ): Promise<void> {
    // 1 — Validação HMAC (apenas em produção, controlado por env)
    this.validateMercadoPagoSignature(dto, headers);

    const paymentStatus = this.mapMercadoPagoStatus(dto.status);

    this.logger.log(
      `Recebido webhook Mercado Pago para userId=${dto.userId} paymentId=${dto.paymentId} status=${dto.status} -> mapped=${paymentStatus}`,
    );

    // Idempotência — verifica se já existe pagamento com este providerPaymentId
    const existing = await this.prisma.payment.findFirst({
      where: { providerPaymentId: dto.paymentId },
    });

    let payment;
    let wasPaidBefore = false;

    if (existing) {
      wasPaidBefore = existing.status === PaymentStatus.PAID;

      this.logger.log(
        `Pagamento já existente. Atualizando estado anterior=${existing.status} → novo=${paymentStatus}`,
      );

      payment = await this.prisma.payment.update({
        where: { id: existing.id },
        data: {
          amount: dto.amountInCents,
          currency: dto.currency,
          providerEventType: dto.eventType ?? null,
          status: paymentStatus,
          rawPayload: dto.rawPayload ?? dto,
        },
      });
    } else {
      payment = await this.prisma.payment.create({
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
    }

    if (paymentStatus !== PaymentStatus.PAID) {
      this.logger.log(
        'Pagamento não está completo, nenhuma assinatura ativada.',
      );
      return;
    }

    // Se já estava PAID antes → ignoramos
    if (wasPaidBefore) {
      this.logger.log('Webhook repetido. Assinatura já ativada anteriormente.');
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
