import { Controller, Get } from '@nestjs/common';
import { getPublicPlans } from '../../config/plans.config';

export class PublicPlanDto {
  id!: string;
  name!: string;
  description!: string;
  price!: number;
  currency!: string;
  interval!: string;
  intervalCount!: number;
}

@Controller('plans')
export class PlansController {
  /**
   * Retorna a lista de planos públicos disponíveis para assinatura.
   *
   * Rota final (considerando prefixo global "api"):
   *   GET /api/plans
   */
  @Get()
  findAll(): PublicPlanDto[] {
    const plans = getPublicPlans();

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      intervalCount: plan.intervalCount,
    }));
  }
}
