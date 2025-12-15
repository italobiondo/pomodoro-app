export const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
	status: number;
	method: string;
	path: string;
	body: unknown;

	constructor(args: {
		status: number;
		method: string;
		path: string;
		body: unknown;
	}) {
		super(`${args.method} ${args.path} failed with status ${args.status}`);
		this.name = "ApiError";
		this.status = args.status;
		this.method = args.method;
		this.path = args.path;
		this.body = args.body;
	}
}

async function readErrorBody(res: Response): Promise<unknown> {
	const contentType = res.headers.get("content-type") ?? "";
	try {
		if (contentType.includes("application/json")) return await res.json();
		const text = await res.text();
		return text ? { message: text } : null;
	} catch {
		return null;
	}
}

async function assertOk(
	res: Response,
	method: string,
	path: string
): Promise<void> {
	if (res.ok) return;
	const body = await readErrorBody(res);
	throw new ApiError({ status: res.status, method, path, body });
}

export async function apiGet<T>(path: string): Promise<T> {
	const res = await fetch(`${API_BASE_URL}${path}`, {
		method: "GET",
		credentials: "include",
	});

	await assertOk(res, "GET", path);
	return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
	const res = await fetch(`${API_BASE_URL}${path}`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: body ? JSON.stringify(body) : undefined,
	});

	await assertOk(res, "POST", path);

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
		headers: { "Content-Type": "application/json" },
		body: body ? JSON.stringify(body) : undefined,
	});

	await assertOk(res, "PATCH", path);
	return res.json() as Promise<T>;
}

export async function apiDelete<T = void>(path: string): Promise<T> {
	const res = await fetch(`${API_BASE_URL}${path}`, {
		method: "DELETE",
		credentials: "include",
	});

	await assertOk(res, "DELETE", path);

	if (res.status === 204) {
		// @ts-expect-error - quando T for void
		return undefined;
	}

	return res.json() as Promise<T>;
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
	const res = await fetch(`${API_BASE_URL}${path}`, {
		method: "PUT",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: body ? JSON.stringify(body) : undefined,
	});

	await assertOk(res, "PUT", path);

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
