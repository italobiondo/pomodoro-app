import { Body, Controller, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MercadoPagoWebhookDto } from './dto/mercado-pago-webhook.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Endpoint para receber webhooks do Mercado Pago.
   *
   * MVP: aceita o DTO simplificado. Em produção:
   * - Validar assinatura/checksum
   * - Garantir que userId vem de metadata do provedor (não do client)
   */
  @Post('mercado-pago/webhook')
  async handleMercadoPagoWebhook(@Body() body: MercadoPagoWebhookDto) {
    await this.paymentsService.handleMercadoPagoWebhook(body);
    return { received: true };
  }
}
