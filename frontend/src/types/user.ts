export type PlanType = "FREE" | "PRO";

export type PlanStatus = "ACTIVE" | "CANCELED" | "TRIAL" | "EXPIRED";

export type SubscriptionStatus = "ACTIVE" | "CANCELED" | "PAST_DUE";

export interface SubscriptionInfo {
	provider: string;
	status: SubscriptionStatus;
	currentPeriodStart: string;
	currentPeriodEnd: string;
}

export interface SubscriptionStatusResponse {
	isPro: boolean;
	plan: PlanType;
	planStatus: PlanStatus;
	planExpiresAt: string | null;
	subscription: SubscriptionInfo | null;
}

// Esse é o tipo base do usuário retornado por /api/auth/me.
// Adapte os campos conforme o que sua API já devolve hoje.
export interface User {
	id: string;
	email: string;
	name: string | null;

	// Campos de plano vindos do backend de /subscriptions/me
	isPro: boolean;
	plan: PlanType;
	planStatus: PlanStatus;
	planExpiresAt: string | null;

	// Info opcional de assinatura
	subscription?: SubscriptionInfo | null;
}
