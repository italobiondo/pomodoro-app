export class SubscriptionStatusResponseDto {
  isPro: boolean;
  plan: 'FREE' | 'PRO';
  planStatus: 'ACTIVE' | 'CANCELED' | 'TRIAL' | 'EXPIRED';
  planExpiresAt: string | null;

  subscription: {
    provider: string;
    status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
    currentPeriodStart: string;
    currentPeriodEnd: string;
  } | null;
}

export type ActivateSubscriptionInput = {
  provider: string; // 'mercado_pago' | 'stripe' | etc.
  providerCustomerId: string;
  providerSubscriptionId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
};
