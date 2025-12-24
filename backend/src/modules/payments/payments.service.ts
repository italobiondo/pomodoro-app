/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-base-to-string */
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

    const tsNum = Number(ts);
    if (!Number.isFinite(tsNum)) {
      throw new UnauthorizedException(
        'Header x-signature inválido (ts não numérico).',
      );
    }

    // Janela anti-replay: 10 minutos
    const now = Date.now();
    const maxSkewMs = 10 * 60 * 1000;
    if (Math.abs(now - tsNum) > maxSkewMs) {
      this.logger.warn(
        `Webhook Mercado Pago fora da janela anti-replay (ts=${tsNum}, now=${now}, requestId=${requestId}).`,
      );
      throw new UnauthorizedException('Webhook expirado (anti-replay).');
    }

    const resourceId = this.extractResourceId(dto);

    if (!resourceId) {
      this.logger.warn(
        'Webhook Mercado Pago recebido sem resourceId (data.id/paymentId). Requisição rejeitada.',
      );
      throw new UnauthorizedException('Webhook inválido (sem resourceId).');
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

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

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

    const backendUrl = process.env.BACKEND_URL; // recomendado em prod (HTTPS público)

    const frontendIsHttps = frontendUrl.startsWith('https://');
    const backendIsHttps = !!backendUrl && backendUrl.startsWith('https://');

    // Em dev/local (HTTP), o Mercado Pago pode bloquear back_urls HTTP.
    // Então só configuramos back_urls/auto_return quando o FRONTEND_URL for HTTPS.
    const backUrls = frontendIsHttps
      ? {
          success: `${frontendUrl}/pro/success`,
          pending: `${frontendUrl}/pro/success`,
          failure: `${frontendUrl}/pro`,
        }
      : undefined;

    // Webhook só funciona de verdade se BACKEND_URL for público/HTTPS.
    // Mantemos condicional para não “enganar” em dev/local.
    const notificationUrl = backendIsHttps
      ? `${backendUrl}/api/payments/mercado-pago/webhook`
      : undefined;

    const body: Record<string, any> = {
      items: [
        {
          id: plan.id, // 'PRO_MONTHLY'
          title: plan.name,
          description: plan.description,
          quantity: 1,
          // Evita ruído de float: 5.9 -> 5.90
          unit_price: Number(plan.price.toFixed(2)),
          currency_id: plan.currency, // 'BRL'
        },
      ],
      metadata: {
        userId,
        planId: plan.id,
        planType: plan.type,
      },

      // Referência estável para reconciliar no webhook (melhor que Date.now()).
      // (Não precisa ser única; o providerPaymentId já garante idempotência.)
      external_reference: `user:${userId}:plan:${plan.id}`,
    };

    if (backUrls) {
      body.back_urls = backUrls;
      body.auto_return = 'approved';
    } else {
      this.logger.warn(
        'FRONTEND_URL não é HTTPS. Mercado Pago pode bloquear back_urls em HTTP; retornos automáticos podem não funcionar em dev/local.',
      );
    }

    if (notificationUrl) {
      body.notification_url = notificationUrl;
    } else {
      this.logger.warn(
        'BACKEND_URL não é HTTPS/público. notification_url não será configurado; webhook só funcionará em ambiente com URL pública.',
      );
    }

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

  private extractResourceId(dto: MercadoPagoWebhookDto): string | undefined {
    const fromData = dto?.data?.id;
    if (fromData !== undefined && fromData !== null) return String(fromData);

    if (dto?.paymentId) return String(dto.paymentId);

    return undefined;
  }

  private isPaymentTopic(dto: MercadoPagoWebhookDto): boolean {
    // Aceita legado do MVP e formato real
    if (!dto) return false;
    if (dto.type) return dto.type === 'payment';
    if (dto.eventType) return dto.eventType.startsWith('payment');
    // Se não vier nenhum, não bloqueia (pode ser MVP)
    return true;
  }

  private parseUserIdFromExternalReference(
    externalReference: unknown,
  ): string | null {
    if (!externalReference) return null;
    const s = String(externalReference);

    // Seu formato atual: "user_<userId>_<timestamp>"
    // Mantemos compatibilidade.
    const m = /^user_(.+)_\d+$/.exec(s);
    if (m?.[1]) return m[1];

    // Alternativas simples (caso você mude no futuro)
    // "pomodoro_user:<id>"
    const m2 = /^pomodoro_user:(.+)$/.exec(s);
    if (m2?.[1]) return m2[1];

    return null;
  }

  private async fetchMercadoPagoPayment(
    paymentId: string,
  ): Promise<any | null> {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) return null;

    // Endpoint usual do MP para Payment
    const url = `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`;

    const fetchFn = (globalThis as any).fetch as
      | ((
          input: string,
          init?: { method?: string; headers?: Record<string, string> },
        ) => Promise<Response>)
      | undefined;

    if (!fetchFn) return null;

    const res = await fetchFn(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return null;

    const json = await res.json();
    return json;
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
    rawBody?: Buffer,
  ): Promise<void> {
    // 0) Validar tópico esperado (não processar lixo)
    if (!this.isPaymentTopic(dto)) {
      this.logger.warn(
        `Webhook Mercado Pago ignorado (topic/type não suportado). type=${String(dto.type)} eventType=${String(dto.eventType)}`,
      );
      return;
    }

    // 1) Validar assinatura (produção) — usando resourceId real
    this.validateMercadoPagoSignature(dto, headers);

    const resourceId = this.extractResourceId(dto);
    if (!resourceId) {
      this.logger.warn(
        'Webhook Mercado Pago sem resourceId após parse. Ignorando.',
      );
      return;
    }

    // 2) Fonte de verdade: buscar detalhes do payment no MP (se possível)
    const mpPayment = await this.fetchMercadoPagoPayment(resourceId);

    // 3) Resolver userId e status/amount/currency
    // Preferir dados do MP; fallback para MVP dto.* em dev
    const resolvedStatus: string | undefined =
      (mpPayment?.status as string | undefined) ?? dto.status;

    const paymentStatus = this.mapMercadoPagoStatus(
      resolvedStatus ?? 'unknown',
    );

    const resolvedAmountInCents: number =
      mpPayment?.transaction_amount !== undefined &&
      mpPayment?.transaction_amount !== null
        ? Math.round(Number(mpPayment.transaction_amount) * 100)
        : (dto.amountInCents ?? 0);

    const resolvedCurrency: string =
      (mpPayment?.currency_id as string | undefined) ?? dto.currency ?? 'BRL';

    const resolvedUserId: string | null =
      this.parseUserIdFromExternalReference(mpPayment?.external_reference) ??
      dto.userId ??
      null;

    // Segurança: não processar pagamento sem conseguir amarrar em um usuário
    if (!resolvedUserId) {
      this.logger.warn(
        `Webhook Mercado Pago sem userId resolvido (paymentId=${resourceId}). Ignorando para evitar ativação indevida.`,
      );
      return;
    }

    // 4) Auditoria mínima: log estruturado sem payload
    this.logger.log(
      `Webhook Mercado Pago recebido. paymentId=${resourceId} userId=${resolvedUserId} statusRaw=${String(
        resolvedStatus,
      )} mapped=${paymentStatus}`,
    );

    // 5) Idempotência + transação: Payment + Subscription + User coerentes
    await this.prisma.$transaction(async (tx) => {
      // Payment agora é idempotente forte via providerPaymentId UNIQUE
      const existingPayment = await tx.payment.findUnique({
        where: { providerPaymentId: resourceId },
      });

      const userExists = await tx.user.findUnique({
        where: { id: resolvedUserId },
        select: { id: true },
      });

      if (!userExists) {
        this.logger.warn(
          `Webhook Mercado Pago com userId inexistente no banco. Ignorando. paymentId=${resourceId} userId=${resolvedUserId}`,
        );
        return;
      }

      const previousStatus = existingPayment?.status ?? null;

      // Upsert atômico (idempotência forte)
      const payment = await tx.payment.upsert({
        where: { providerPaymentId: resourceId },
        update: {
          amount: resolvedAmountInCents,
          currency: resolvedCurrency,
          providerEventType: dto.type ?? dto.eventType ?? null,
          status: paymentStatus,
          rawPayload:
            (process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development') ===
            'production'
              ? undefined
              : (dto.rawPayload ?? dto),
        },
        create: {
          userId: resolvedUserId,
          providerPaymentId: resourceId,
          amount: resolvedAmountInCents,
          currency: resolvedCurrency,
          status: paymentStatus,
          providerEventType: dto.type ?? dto.eventType ?? null,
          rawPayload:
            (process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development') ===
            'production'
              ? undefined
              : (dto.rawPayload ?? dto),
        },
      });

      // PENDING: não ativa nem desativa (apenas registra)
      if (paymentStatus === PaymentStatus.PENDING) {
        return;
      }

      // FAILED: transição negativa -> revoga PRO idempotentemente
      if (paymentStatus === PaymentStatus.FAILED) {
        const negativePlanStatus =
          this.classifyNegativePlanStatus(resolvedStatus);

        const provider = 'mercado_pago';
        const providerSubscriptionId = `mp_sub_user_${resolvedUserId}`;

        const existingSub = await tx.subscription.findUnique({
          where: {
            provider_providerSubscriptionId: {
              provider,
              providerSubscriptionId,
            },
          },
          select: { id: true },
        });

        if (existingSub) {
          await tx.subscription.update({
            where: { id: existingSub.id },
            data: { status: 'CANCELED' },
          });

          // vincula o pagamento à subscription, se fizer sentido
          await tx.payment.update({
            where: { providerPaymentId: resourceId },
            data: { subscriptionId: existingSub.id },
          });
        }

        await tx.user.update({
          where: { id: resolvedUserId },
          data: {
            plan: 'FREE',
            planStatus: negativePlanStatus,
            planExpiresAt: new Date(),
          },
        });

        return;
      }

      // A partir daqui é PAID
      // Se já era PAID antes para este mesmo providerPaymentId, não repetir efeitos
      if (previousStatus === PaymentStatus.PAID) {
        return;
      }

      // Subscription idempotente por (provider, providerSubscriptionId)
      // MVP: 1 assinatura por usuário no provedor
      const provider = 'mercado_pago';
      const providerSubscriptionId = `mp_sub_user_${resolvedUserId}`;
      const providerCustomerId = `mp_customer_${resolvedUserId}`;

      const now = new Date();

      // Para renovação correta: se já existe e está vigente, estende a partir do fim atual
      const existingSub = await tx.subscription.findUnique({
        where: {
          provider_providerSubscriptionId: {
            provider,
            providerSubscriptionId,
          },
        },
        select: { id: true, currentPeriodEnd: true },
      });

      const baseDate =
        existingSub?.currentPeriodEnd && existingSub.currentPeriodEnd > now
          ? existingSub.currentPeriodEnd
          : now;

      const currentPeriodStart = now;
      const currentPeriodEnd = addMonths(baseDate, 1);

      const subscription = await tx.subscription.upsert({
        where: {
          provider_providerSubscriptionId: {
            provider,
            providerSubscriptionId,
          },
        },
        update: {
          userId: resolvedUserId,
          providerCustomerId,
          status: 'ACTIVE',
          currentPeriodStart,
          currentPeriodEnd,
        },
        create: {
          userId: resolvedUserId,
          provider,
          providerCustomerId,
          providerSubscriptionId,
          status: 'ACTIVE',
          currentPeriodStart,
          currentPeriodEnd,
        },
      });

      // Vincula o payment na subscription (auditoria/consistência)
      await tx.payment.update({
        where: { providerPaymentId: resourceId },
        data: { subscriptionId: subscription.id },
      });

      // Ativa PRO
      await tx.user.update({
        where: { id: resolvedUserId },
        data: {
          plan: 'PRO',
          planStatus: 'ACTIVE',
          planExpiresAt: currentPeriodEnd,
        },
      });
    });
  }

  private classifyNegativePlanStatus(
    statusRaw?: string | null,
  ): 'CANCELED' | 'EXPIRED' {
    const s = (statusRaw ?? '').toLowerCase();
    if (s.includes('expired')) return 'EXPIRED';
    return 'CANCELED';
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
