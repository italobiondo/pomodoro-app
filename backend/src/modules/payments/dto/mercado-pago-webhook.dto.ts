// backend/src/modules/payments/dto/mercado-pago-webhook.dto.ts

/**
 * DTO simplificado para MVP de webhook do Mercado Pago.
 *
 * Quando integrar com o webhook real do MP, podemos:
 * - Usar os campos reais do webhook (type, action, data.id, etc.)
 * - Buscar detalhes via API do MP para chegar em amount, currency, status, metadata.user_id, etc.
 */
export class MercadoPagoWebhookDto {
  // MVP: ID do usuário no nosso sistema (depois virá de metadata do MP)
  userId: string;

  // ID do pagamento no Mercado Pago
  paymentId: string;

  // Valor em centavos
  amountInCents: number;

  // Ex: "BRL"
  currency: string;

  /**
   * Status no formato Mercado Pago (MVP):
   * - "approved"  -> pago
   * - "pending"   -> pendente
   * - "rejected"  -> falhou
   */
  status: string;

  // Tipo de evento (ex: "payment", "payment.updated")
  eventType?: string;

  // Payload bruto opcional
  rawPayload?: unknown;
}
