"use client";

import { useState } from "react";
import Link from "next/link";
import { MainHeader } from "@/components/Layout/MainHeader";
import { useAuth } from "@/hooks/useAuth";
import { createMercadoPagoPreference } from "@/lib/apiClient";

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
		<main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
			<MainHeader />

			<div className="flex-1 flex items-center justify-center px-4 py-8">
				<div className="w-full max-w-xl bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
					<h1 className="text-2xl font-semibold">Plano Pomodoro Pro</h1>

					<p className="text-sm text-slate-300">
						Assine o plano Pro para desbloquear todos os recursos avançados do
						Pomodoro App.
					</p>

					<ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
						<li>Sincronização de tasks em múltiplos dispositivos</li>
						<li>Histórico completo de foco e estatísticas avançadas</li>
						<li>Limite ampliado de tasks e sessões</li>
					</ul>

					{loading && (
						<p className="text-sm text-slate-400">
							Carregando informações da sua conta...
						</p>
					)}

					{!loading && !isAuthenticated && (
						<div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
							<p className="text-sm text-slate-300">
								Para assinar o plano Pro, entre com sua conta Google.
							</p>
							<button
								type="button"
								onClick={loginWithGoogle}
								className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-slate-100 text-slate-900 hover:bg-white transition"
							>
								Entrar com Google
							</button>
						</div>
					)}

					{!loading && isAuthenticated && !isPro && (
						<div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
							<div className="text-sm text-slate-300">
								<p className="font-medium">Plano Mensal – R$ 19,90</p>
								<p className="text-slate-400">
									Pagamento processado com segurança pelo Mercado Pago.
								</p>
							</div>

							<div className="flex flex-col items-start sm:items-end gap-2">
								<button
									type="button"
									onClick={handleSubscribeClick}
									disabled={creatingPreference}
									className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
								>
									{creatingPreference ? "Redirecionando..." : "Assinar Pro"}
								</button>
								{error && (
									<p className="text-xs text-red-400 text-left sm:text-right">
										{error}
									</p>
								)}
							</div>
						</div>
					)}

					{!loading && isAuthenticated && isPro && (
						<p className="text-sm text-emerald-400">
							Você já é Pro 🎉 — você pode gerenciar sua assinatura em{" "}
							<Link
								href="/pro/manage"
								className="font-semibold underline text-emerald-300 hover:text-emerald-200"
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
