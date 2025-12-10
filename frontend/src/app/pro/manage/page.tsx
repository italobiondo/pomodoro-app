"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainHeader } from "@/components/Layout/MainHeader";
import { useAuth } from "@/hooks/useAuth";

export default function ProManagePage() {
	const { user, loading, isAuthenticated, isPro } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;

		// Não autenticado ou não Pro → volta para /pro (página de upgrade)
		if (!isAuthenticated || !isPro) {
			router.replace("/pro");
		}
	}, [loading, isAuthenticated, isPro, router]);

	const subscription = user?.subscription as
		| {
				provider: string;
				status: string;
				currentPeriodStart: string | null;
				currentPeriodEnd: string | null;
		  }
		| null
		| undefined;

	const planStatus = user?.planStatus ?? (isPro ? "ACTIVE" : "INACTIVE");
	const planExpiresAt = user?.planExpiresAt
		? new Date(user.planExpiresAt)
		: null;

	const currentPeriodStart = subscription?.currentPeriodStart
		? new Date(subscription.currentPeriodStart)
		: null;

	const currentPeriodEnd = subscription?.currentPeriodEnd
		? new Date(subscription.currentPeriodEnd)
		: null;

	function formatDate(date: Date | null) {
		if (!date) return "-";
		return date.toLocaleString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	return (
		<main className="min-h-screen flex flex-col bg-background text-secondary">
			<MainHeader showSettings={false} />

			<div className="flex-1 flex items-center justify-center px-4 py-8">
				<div className="w-full max-w-2xl card-main p-6 sm:p-8 flex flex-col gap-6">
					<h1 className="text-2xl font-semibold text-primary">
						Gerenciar plano Pro
					</h1>

					{loading && (
						<p className="text-sm text-muted">
							Carregando informações da sua assinatura...
						</p>
					)}

					{!loading && !isAuthenticated && (
						<p className="text-sm text-secondary">
							Você precisa estar autenticado para ver os detalhes do seu plano.
						</p>
					)}

					{!loading && isAuthenticated && (
						<>
							<section className="space-y-2">
								<h2 className="text-sm font-semibold text-primary">
									Status do plano
								</h2>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
									<div className="space-y-1">
										<p className="text-muted">Plano atual</p>
										<p className="font-medium text-secondary">
											{isPro ? "Pomodoro Pro" : "Plano Free"}
										</p>
									</div>

									<div className="space-y-1">
										<p className="text-muted">Status</p>
										<p
											className={
												planStatus === "ACTIVE"
													? "font-medium text-emerald-500"
													: "font-medium text-secondary"
											}
										>
											{planStatus}
										</p>
									</div>

									<div className="space-y-1">
										<p className="text-muted">Provedor</p>
										<p className="font-medium text-secondary">
											{subscription?.provider ?? "-"}
										</p>
									</div>

									<div className="space-y-1">
										<p className="text-muted">Expira em</p>
										<p className="font-medium text-secondary">
											{planExpiresAt ? formatDate(planExpiresAt) : "-"}
										</p>
									</div>
								</div>
							</section>

							<section className="space-y-2">
								<h2 className="text-sm font-semibold text-primary">
									Período atual da assinatura
								</h2>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
									<div className="space-y-1">
										<p className="text-muted">Início do período</p>
										<p className="font-medium text-secondary">
											{formatDate(currentPeriodStart)}
										</p>
									</div>

									<div className="space-y-1">
										<p className="text-muted">Fim do período</p>
										<p className="font-medium text-secondary">
											{formatDate(currentPeriodEnd)}
										</p>
									</div>
								</div>
							</section>

							<section className="space-y-3">
								<h2 className="text-sm font-semibold text-primary">
									Ações da assinatura
								</h2>

								{!isPro && (
									<p className="text-sm text-secondary">
										No momento, você está no plano Free. Para assinar o plano
										Pro, acesse a página{" "}
										<span className="font-semibold">/pro</span> e inicie o
										checkout pelo Mercado Pago.
									</p>
								)}

								{isPro && (
									<>
										<p className="text-sm text-secondary">
											No futuro, aqui você poderá gerenciar a sua assinatura
											(Provedor: Mercado Pago), incluindo cancelamento, troca de
											plano e visualização de histórico de cobranças.
										</p>

										<button
											type="button"
											disabled
											className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-soft text-muted cursor-not-allowed border border-soft"
										>
											Cancelar assinatura (em breve)
										</button>
									</>
								)}
							</section>
						</>
					)}
				</div>
			</div>
		</main>
	);
}
