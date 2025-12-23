// backend/src/modules/payments/dto/mercado-pago-webhook.dto.ts

import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class MercadoPagoWebhookDataDto {
  @IsOptional()
  @IsString()
  id?: string;
}

/**
 * Webhook do Mercado Pago:
 * - formato comum: { type: "payment", action: "...", data: { id: "123" } }
 *
 * Mantemos campos "legados" (MVP) para testes locais e fallback.
 * Como o app usa ValidationPipe com whitelist+forbidNonWhitelisted,
 * todos os campos permitidos precisam de decorators.
 */
export class MercadoPagoWebhookDto {
  // Formato real (comum)
  @IsOptional()
  @IsString()
  @IsIn(['payment', 'merchant_order', 'preapproval'], {
    message: 'type inválido (esperado payment/merchant_order/preapproval)',
  })
  type?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MercadoPagoWebhookDataDto)
  data?: MercadoPagoWebhookDataDto;

  // MVP legado (fallback)
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsNumber()
  amountInCents?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsObject()
  rawPayload?: unknown;
}
