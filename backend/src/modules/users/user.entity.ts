export type PlanType = 'free' | 'pro';

export class User {
  id: string;
  email: string;
  name?: string | null;
  provider: 'google' | 'apple';
  providerId: string;
  plan: PlanType;
  planExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
