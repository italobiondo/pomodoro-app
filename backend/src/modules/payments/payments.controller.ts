import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
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
   * Segurança: endpoint sensível (evitar abuso/geração massiva).
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60 } })
  @Post('mercado-pago/create-preference')
  async createMercadoPagoPreference(
    @CurrentUser() user: any,
  ): Promise<CreateMercadoPagoPreferenceResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.paymentsService.createMercadoPagoPreference(user.id);
  }

  /**
   * Endpoint para receber webhooks do Mercado Pago.
   *
   * Importante: provedores podem mandar bursts e retries.
   * - Mantemos o throttler desabilitado aqui para não perder eventos.
   * - A segurança real fica na validação HMAC + idempotência (já existe no service).
   */
  @SkipThrottle()
  @Post('mercado-pago/webhook')
  async handleMercadoPagoWebhook(
    @Body() body: MercadoPagoWebhookDto,
    @Headers() headers: Record<string, string | string[]>,
  ) {
    await this.paymentsService.handleMercadoPagoWebhook(body, headers);
    return { received: true };
  }
}
