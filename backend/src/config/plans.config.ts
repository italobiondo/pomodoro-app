import { PlanType } from '../generated/prisma/client/client';

export type PlanId = 'PRO_MONTHLY';

export type BillingInterval = 'month' | 'year';

export interface PlanDefinition {
  /**
   * Identificador lógico do plano (usado em metadata, API interna, etc.)
   */
  id: PlanId;

  /**
   * Tipo de plano associado ao usuário (enum do Prisma).
   * Hoje: FREE | PRO
   */
  type: PlanType;

  /**
   * Nome que aparece no checkout / tela de planos.
   */
  name: string;

  /**
   * Descrição resumida para exibir no frontend.
   */
  description: string;

  /**
   * Valor em moeda (decimal) usado na API do Mercado Pago.
   * Ex.: 19.9 → R$ 19,90
   */
  price: number;

  /**
   * Moeda em formato ISO, ex.: "BRL".
   */
  currency: 'BRL';

  /**
   * Intervalo de cobrança (month/year).
   */
  interval: BillingInterval;

  /**
   * Quantidade de intervalos (ex.: 1 mês, 12 meses, etc.).
   */
  intervalCount: number;

  /**
   * Se o plano é público (visível na listagem de planos).
   */
  isPublic: boolean;

  /**
   * Se é o plano padrão que usamos no checkout Pro.
   */
  isDefault: boolean;

  /**
   * Se é recorrente (para evolução futura com assinaturas recorrentes).
   */
  isRecurring: boolean;
}

export const ALL_PLANS: PlanDefinition[] = [
  {
    id: 'PRO_MONTHLY',
    type: PlanType.PRO,
    name: 'Pomodoro Pro - Plano Mensal',
    description:
      'Acesso ao plano Pro: tasks avançadas, estatísticas de foco e experiência sem anúncios.',
    price: 5.9,
    currency: 'BRL',
    interval: 'month',
    intervalCount: 1,
    isPublic: true,
    isDefault: true,
    isRecurring: true,
  },
];

export const DEFAULT_PUBLIC_PRO_PLAN_ID: PlanId = 'PRO_MONTHLY';

export function getPlanById(id: PlanId): PlanDefinition | undefined {
  return ALL_PLANS.find((plan) => plan.id === id);
}

export function getPublicPlans(): PlanDefinition[] {
  return ALL_PLANS.filter((plan) => plan.isPublic);
}
