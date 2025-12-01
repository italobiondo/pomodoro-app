import { PlanType } from '../users/user.entity';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  plan: PlanType;
  planExpiresAt?: Date | null;
}
