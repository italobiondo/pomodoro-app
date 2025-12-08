"use client";

import { useState } from "react";
import { TimerPanel } from "@/components/Timer/TimerPanel";
import { RightColumnFree } from "@/components/FreeLayout/RightColumnFree";
import { YoutubePlayer } from "@/components/YoutubePlayer/YoutubePlayer";
import { FreeAdFooter } from "@/components/FreeLayout/FreeAdFooter";
import { MainHeader } from "@/components/Layout/MainHeader";
import { useAuth } from "@/hooks/useAuth";
import { createMercadoPagoPreference } from "@/lib/apiClient";

export default function HomePage() {
	const { isPro, isAuthenticated, loading, loginWithGoogle } = useAuth();
	const [creatingPreference, setCreatingPreference] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubscribeClick() {
		try {
			setError(null);
			setCreatingPreference(true);

			const res = await createMercadoPagoPreference();
			// Redireciona para o checkout do Mercado Pago
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
			{/* Header */}
			<MainHeader />

			{/* Conteúdo principal */}
			<div className="w-full max-w-4xl mx-auto grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-stretch pt-4">
				<div className="flex flex-col items-center gap-4 px-4">
					<div className="w-full max-w-md">
						<TimerPanel />
					</div>

					<div className="w-full max-w-md">
						<YoutubePlayer />
					</div>
				</div>

				<RightColumnFree />
			</div>

			{/* Seção de plano Pro */}
			<div className="w-full max-w-4xl mx-auto mt-8 px-4">
				<div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col gap-3">
					<h2 className="text-lg sm:text-xl font-semibold">
						Plano Pomodoro Pro
					</h2>

					<p className="text-sm text-slate-300">
						Desbloqueie o plano Pro para aproveitar o máximo do Pomodoro App.
					</p>

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
								<p>Plano Mensal – R$ 19,90</p>
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
							Você já é Pro 🎉 — em breve você poderá gerenciar sua assinatura
							em
							<span className="font-semibold"> /pro/manage</span>.
						</p>
					)}
				</div>
			</div>

			{/* Rodapé de anúncio — só aparece quando rolar a página (somente no Free) */}
			{!isPro && <FreeAdFooter />}
		</main>
	);
}
