export const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export async function apiGet<T>(path: string): Promise<T> {
	const res = await fetch(`${API_BASE_URL}${path}`, {
		method: "GET",
		credentials: "include",
	});

	if (!res.ok) {
		throw new Error(`GET ${path} failed with status ${res.status}`);
	}

	return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
	const res = await fetch(`${API_BASE_URL}${path}`, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: body ? JSON.stringify(body) : undefined,
	});

	if (!res.ok) {
		throw new Error(`POST ${path} failed with status ${res.status}`);
	}

	if (res.status === 204) {
		// @ts-expect-error - quando T for void
		return undefined;
	}

	return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
	const res = await fetch(`${API_BASE_URL}${path}`, {
		method: "PATCH",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: body ? JSON.stringify(body) : undefined,
	});

	if (!res.ok) {
		throw new Error(`PATCH ${path} failed with status ${res.status}`);
	}

	return res.json() as Promise<T>;
}

export async function apiDelete<T = void>(path: string): Promise<T> {
	const res = await fetch(`${API_BASE_URL}${path}`, {
		method: "DELETE",
		credentials: "include",
	});

	if (!res.ok) {
		throw new Error(`DELETE ${path} failed with status ${res.status}`);
	}

	if (res.status === 204) {
		// @ts-expect-error - quando T for void
		return undefined;
	}

	return res.json() as Promise<T>;
}

export type CreateMercadoPagoPreferenceResponse = {
	init_point: string;
};

export function createMercadoPagoPreference(): Promise<CreateMercadoPagoPreferenceResponse> {
	return apiPost<CreateMercadoPagoPreferenceResponse>(
		"/payments/mercado-pago/create-preference"
	);
}

export type Plan = {
	id: string;
	name: string;
	description: string;
	price: number;
	currency: string;
	interval: string;
	intervalCount: number;
};

export function getPlans(): Promise<Plan[]> {
	return apiGet<Plan[]>("/plans");
}
