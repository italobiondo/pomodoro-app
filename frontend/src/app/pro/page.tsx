"use client";

import { useState } from "react";
import Link from "next/link";
import { MainHeader } from "@/components/Layout/MainHeader";
import { useAuth } from "@/hooks/useAuth";
import { createMercadoPagoPreference } from "@/lib/apiClient";
import { LogIn } from "lucide-react";

export default function ProPage() {
	const { isPro, isAuthenticated, loading, loginWithGoogle } = useAuth();
	const [creatingPreference, setCreatingPreference] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubscribeClick() {
		try {
			setError(null);
			setCreatingPreference(true);

			const res = await createMercadoPagoPreference();
			window.location.href = res.init_point;
		} catch (err) {
			console.error("[/pro] Erro ao criar preference do Mercado Pago", err);
			setError("Não foi possível iniciar o checkout. Tente novamente.");
		} finally {
			setCreatingPreference(false);
		}
	}

	return (
		<main className="min-h-screen flex flex-col bg-background text-secondary">
			<MainHeader showSettings={false} />

			<div className="flex-1 flex items-center justify-center px-4 py-8">
				<div className="w-full max-w-xl card-main p-6 sm:p-8 flex flex-col gap-4">
					<h1 className="text-2xl font-semibold text-primary">
						Plano Pomodoro Pro
					</h1>

					<p className="text-sm text-secondary">
						Assine o plano Pro para desbloquear todos os recursos avançados do
						Pomodoro App.
					</p>

					<ul className="text-sm text-secondary list-disc list-inside space-y-1">
						<li>Sincronização de tasks em múltiplos dispositivos</li>
						<li>Histórico completo de foco e estatísticas avançadas</li>
						<li>Limite ampliado de tasks e sessões</li>
					</ul>

					{loading && (
						<p className="text-sm text-muted">
							Carregando informações da sua conta...
						</p>
					)}

					{!loading && !isAuthenticated && (
						<div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
							<p className="text-sm text-secondary">
								Para assinar o plano Pro, entre com sua conta Google.
							</p>
							<button
								onClick={loginWithGoogle}
								className="px-4 py-2 text-sm flex items-center justify-center gap-2 btn-primary"
							>
								<LogIn className="h-4 w-4" aria-hidden />
								<span>Entrar com Google</span>
							</button>
						</div>
					)}

					{!loading && isAuthenticated && !isPro && (
						<div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
							<div className="text-sm text-secondary">
								<p className="font-medium">Plano Mensal - R$ 19,90</p>
								<p className="text-muted">
									Pagamento processado com segurança pelo Mercado Pago.
								</p>
							</div>

							<div className="flex flex-col items-start sm:items-end gap-2">
								<button
									type="button"
									onClick={handleSubscribeClick}
									disabled={creatingPreference}
									className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium btn-primary"
								>
									{creatingPreference ? "Redirecionando..." : "Assinar Pro"}
								</button>
								{error && (
									<p className="text-xs text-red-500 text-left sm:text-right">
										{error}
									</p>
								)}
							</div>
						</div>
					)}

					{!loading && isAuthenticated && isPro && (
						<p className="text-sm text-emerald-500">
							Você já é Pro 🎉 — você pode gerenciar sua assinatura em{" "}
							<Link
								href="/pro/manage"
								className="font-semibold underline text-emerald-500 hover:text-emerald-400"
							>
								/pro/manage
							</Link>
							.
						</p>
					)}
				</div>
			</div>
		</main>
	);
}
