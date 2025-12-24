"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MainHeader } from "@/components/Layout/MainHeader";
import { useAuth } from "@/hooks/useAuth";

type SubscriptionMeResponse = {
	isPro: boolean;
	plan: "FREE" | "PRO";
	planStatus: "ACTIVE" | "EXPIRED" | "CANCELED" | "PENDING" | "TRIAL" | string;
	planExpiresAt: string | null;
	subscription: null | {
		provider: string;
		status: "ACTIVE" | "CANCELED" | "EXPIRED" | string;
		currentPeriodStart: string;
		currentPeriodEnd: string;
	};
};

type UiState =
	| { status: "loading"; attempt: number }
	| { status: "pro_active"; data: SubscriptionMeResponse }
	| { status: "not_active"; data: SubscriptionMeResponse }
	| { status: "error"; message: string; attempt: number };

const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

function formatDateTime(iso: string | null): string {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "—";
	return d.toLocaleString();
}

type StatusKind = "active" | "pending" | "canceled" | "expired" | "unknown";

function getStatusKind(data: SubscriptionMeResponse): StatusKind {
	const subStatus = (data.subscription?.status ?? "").toUpperCase();
	const planStatus = (data.planStatus ?? "").toUpperCase();

	const s = subStatus || planStatus;

	if (s === "ACTIVE") return "active";
	if (s === "PENDING") return "pending";
	if (
		s === "CANCELED" ||
		s === "CANCELLED" ||
		s === "CHARGED_BACK" ||
		s === "REFUNDED"
	)
		return "canceled";
	if (s === "EXPIRED") return "expired";

	// se não veio subscription, frequentemente é “pendente de webhook”
	if (!data.subscription) return "pending";

	return "unknown";
}

function getNotActiveCopy(kind: StatusKind) {
	switch (kind) {
		case "pending":
			return {
				title: "Estamos confirmando seu pagamento",
				subtitle:
					"Se você acabou de concluir o pagamento, aguarde alguns segundos e clique em “Atualizar status”.",
				dateLabel: "Expiração",
				primaryAction: "refresh" as const,
			};
		case "canceled":
			return {
				title: "Pagamento cancelado/estornado",
				subtitle:
					"O Pro não foi ativado. Se isso não era esperado, tente novamente ou volte para a página do Pro.",
				dateLabel: "Cancelado em",
				primaryAction: "goToPro" as const,
			};
		case "expired":
			return {
				title: "Assinatura expirada",
				subtitle:
					"Seu período Pro expirou. Para reativar, volte para a página do Pro e assine novamente.",
				dateLabel: "Expirou em",
				primaryAction: "goToPro" as const,
			};
		default:
			return {
				title: "Não foi possível confirmar a ativação do Pro",
				subtitle:
					"Caso você tenha acabado de concluir o pagamento, clique em “Atualizar status”. Se o pagamento tiver sido cancelado/estornado, você continuará como FREE.",
				dateLabel: "Expiração",
				primaryAction: "refresh" as const,
			};
	}
}

export default function ProSuccessPage() {
	const router = useRouter();
	const { refetch } = useAuth();

	const [ui, setUi] = useState<UiState>({ status: "loading", attempt: 0 });

	const fetchSubscriptionMe =
		useCallback(async (): Promise<SubscriptionMeResponse> => {
			const res = await fetch(`${API_BASE_URL}/subscriptions/me`, {
				method: "GET",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				cache: "no-store",
			});

			if (!res.ok) {
				let body: unknown = null;
				try {
					body = await res.json();
				} catch {
					// ignore
				}
				throw new Error(
					`Falha ao consultar status da assinatura (HTTP ${res.status}). ${
						body ? JSON.stringify(body) : ""
					}`
				);
			}

			return (await res.json()) as SubscriptionMeResponse;
		}, []);

	const runCheck = useCallback(
		async (attempt: number) => {
			try {
				setUi({ status: "loading", attempt });
				const data = await fetchSubscriptionMe();

				// Atualiza o contexto de auth (ex.: header/plan)
				// Não depende do querystring.
				refetch().catch(() => {
					// não bloqueia a UI se auth falhar temporariamente
				});

				if (data.isPro) {
					setUi({ status: "pro_active", data });
					return;
				}

				// Se não está ativo, pode ser:
				// - webhook ainda não processou
				// - pagamento cancelado/chargeback/expirado
				setUi({ status: "not_active", data });
			} catch (err) {
				const msg =
					err instanceof Error
						? err.message
						: "Não foi possível validar o status agora.";
				setUi({ status: "error", message: msg, attempt });
			}
		},
		[fetchSubscriptionMe, refetch]
	);

	// Poll curto (útil quando o usuário volta do pagamento e o webhook ainda está processando)
	useEffect(() => {
		let cancelled = false;

		const maxAttempts = 3;
		const delaysMs = [0, 1200, 2500]; // curto e suficiente para dev/produção

		(async () => {
			for (let i = 0; i < maxAttempts; i++) {
				if (cancelled) return;

				if (delaysMs[i] > 0) {
					await new Promise((r) => setTimeout(r, delaysMs[i]));
					if (cancelled) return;
				}

				await runCheck(i + 1);

				// Se virou PRO, para de tentar
				if (!cancelled) {
					// lê o estado atual via closure não é seguro; então não faz early break aqui.
					// Em vez disso, confiamos no usuário poder clicar em "Atualizar" se necessário.
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [runCheck]);

	const handleRefresh = useCallback(() => {
		void runCheck(0);
	}, [runCheck]);

	const handleGoToPro = useCallback(() => {
		router.push("/pro");
	}, [router]);

	const handleGoToApp = useCallback(() => {
		router.push("/");
	}, [router]);

	const meta = useMemo(() => {
		if (ui.status !== "pro_active" && ui.status !== "not_active") return null;

		const s = ui.data.subscription;
		const expiresAt = ui.data.planExpiresAt ?? s?.currentPeriodEnd ?? null;

		const kind = getStatusKind(ui.data);
		const copy = getNotActiveCopy(kind);

		return {
			subscriptionStatus: s?.status ?? ui.data.planStatus ?? "—",
			provider: s?.provider ?? "—",
			expiresAt,
			kind,
			notActive: copy,
		};
	}, [ui]);

	return (
		<main className="min-h-screen">
			<MainHeader />

			<div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-16">
				<div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur">
					<h1 className="text-2xl font-semibold">Confirmação do plano Pro</h1>

					{ui.status === "loading" && (
						<div className="mt-4 space-y-2">
							<p className="text-sm opacity-80">
								Confirmando seu status no servidor…
							</p>
							<p className="text-xs opacity-60">
								Tentativa: {ui.attempt === 0 ? "manual" : ui.attempt}
							</p>
						</div>
					)}

					{ui.status === "error" && (
						<div className="mt-4 space-y-3">
							<p className="text-sm text-red-300">
								Não foi possível validar seu status agora.
							</p>
							<p className="text-xs opacity-70 break-all">{ui.message}</p>

							<div className="flex flex-wrap gap-2 pt-2">
								<button
									type="button"
									onClick={handleRefresh}
									className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium btn-primary"
								>
									Tentar novamente
								</button>

								<button
									type="button"
									onClick={handleGoToPro}
									className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium btn-secondary"
								>
									Voltar ao Pro
								</button>
							</div>
						</div>
					)}

					{ui.status === "pro_active" && meta && (
						<div className="mt-4 space-y-4">
							<p className="text-sm opacity-90">
								Sua assinatura Pro está ativa.
							</p>

							<div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
									<div>
										<p className="text-xs opacity-60">Provedor</p>
										<p className="font-medium">{meta.provider}</p>
									</div>
									<div>
										<p className="text-xs opacity-60">Status</p>
										<p className="font-medium">{meta.subscriptionStatus}</p>
									</div>
									<div className="sm:col-span-2">
										<p className="text-xs opacity-60">Expira em</p>
										<p className="font-medium">
											{formatDateTime(meta.expiresAt)}
										</p>
									</div>
								</div>
							</div>

							<div className="flex flex-wrap gap-2">
								<button
									type="button"
									onClick={handleGoToApp}
									className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium btn-primary"
								>
									Ir para o app
								</button>

								<button
									type="button"
									onClick={handleRefresh}
									className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium btn-secondary"
								>
									Atualizar status
								</button>
							</div>
						</div>
					)}

					{ui.status === "not_active" && meta && (
						<div className="mt-4 space-y-4">
							<p className="text-sm opacity-90">{meta.notActive.title}</p>

							<div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
									<div>
										<p className="text-xs opacity-60">Provedor</p>
										<p className="font-medium">{meta.provider}</p>
									</div>
									<div>
										<p className="text-xs opacity-60">Status</p>
										<p className="font-medium">{meta.subscriptionStatus}</p>
									</div>
									<div className="sm:col-span-2">
										<p className="text-xs opacity-60">
											{meta.notActive.dateLabel}
										</p>
										<p className="font-medium">
											{formatDateTime(meta.expiresAt)}
										</p>
									</div>
								</div>
							</div>

							<p className="text-xs opacity-70">{meta.notActive.subtitle}</p>

							<div className="flex flex-wrap gap-2">
								{meta.notActive.primaryAction === "refresh" ? (
									<button
										type="button"
										onClick={handleRefresh}
										className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium btn-primary"
									>
										Atualizar status
									</button>
								) : (
									<button
										type="button"
										onClick={handleGoToPro}
										className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium btn-primary"
									>
										Voltar ao Pro
									</button>
								)}

								{meta.notActive.primaryAction === "refresh" ? (
									<button
										type="button"
										onClick={handleGoToPro}
										className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium btn-secondary"
									>
										Voltar ao Pro
									</button>
								) : (
									<button
										type="button"
										onClick={handleRefresh}
										className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium btn-secondary"
									>
										Atualizar status
									</button>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
