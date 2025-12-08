import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MercadoPagoWebhookDto } from './dto/mercado-pago-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateMercadoPagoPreferenceResponseDto } from './dto/create-mercado-pago-preference-response.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Cria uma preferência de pagamento no Mercado Pago para o usuário autenticado.
   *
   * Retorna o init_point que deve ser usado no frontend para redirecionar
   * o usuário para o checkout.
   */
  @UseGuards(JwtAuthGuard)
  @Post('mercado-pago/create-preference')
  async createMercadoPagoPreference(
    @CurrentUser() user: any,
  ): Promise<CreateMercadoPagoPreferenceResponseDto> {
    // Assumimos que CurrentUser possui pelo menos a propriedade "id"
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.paymentsService.createMercadoPagoPreference(user.id);
  }

  /**
   * Endpoint para receber webhooks do Mercado Pago.
   *
   * MVP: aceita o DTO simplificado. Em produção:
   * - Validar assinatura/checksum
   * - Garantir que userId vem de metadata do provedor (não do client)
   */
  @Post('mercado-pago/webhook')
  async handleMercadoPagoWebhook(
    @Body() body: MercadoPagoWebhookDto,
    @Headers('x-signature') signature?: string,
  ) {
    await this.paymentsService.handleMercadoPagoWebhook(body, signature);
    return { received: true };
  }
}
