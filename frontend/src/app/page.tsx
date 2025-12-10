"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { TimerPanel } from "@/components/Timer/TimerPanel";
import { RightColumnFree } from "@/components/FreeLayout/RightColumnFree";
import { YoutubePlayer } from "@/components/YoutubePlayer/YoutubePlayer";
import { FreeAdFooter } from "@/components/FreeLayout/FreeAdFooter";
import { MainHeader } from "@/components/Layout/MainHeader";
import { PomodoroExplanation } from "@/components/Info/PomodoroExplanation";
import { createMercadoPagoPreference } from "@/lib/apiClient";
import { LogIn } from "lucide-react";

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
		<main className="min-h-screen flex flex-col">
			{/* Header */}
			<MainHeader />

			{/* Conteúdo principal */}
			<div className="w-full max-w-4xl mx-auto px-4 pt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-stretch">
				<div className="flex flex-col items-center gap-4">
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
				<div className="card-main p-4 sm:p-6">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						{/* Coluna esquerda: textos */}
						<div className="flex-1 space-y-2">
							<h2 className="text-lg sm:text-xl font-semibold text-secondary">
								Plano Pomodoro Pro
							</h2>

							<p className="text-sm text-secondary">
								Desbloqueie o plano Pro para aproveitar o máximo do Pomodoro
								App.
							</p>

							{loading && (
								<p className="text-sm text-muted">
									Carregando informações da sua conta...
								</p>
							)}

							{!loading && !isAuthenticated && (
								<>
									<p className="text-sm text-secondary">
										Para assinar o plano Pro, entre com sua conta Google.
									</p>
									<p className="text-xs text-muted">
										Você pode testar o app à vontade antes de decidir assinar.
									</p>
								</>
							)}

							{!loading && isAuthenticated && !isPro && (
								<>
									<p className="text-sm text-secondary">
										Plano Mensal – R$ 19,90
									</p>
									<p className="text-xs text-muted">
										Pagamento processado com segurança pelo Mercado Pago.
									</p>
								</>
							)}

							{!loading && isAuthenticated && isPro && (
								<p className="text-sm text-emerald-500">
									Você já é Pro 🎉 — gerencie sua assinatura em{" "}
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

						{/* Coluna direita: CTA */}
						<div className="shrink-0 flex flex-col items-end gap-2">
							{/* Estado: não logado */}
							{!loading && !isAuthenticated && (
								<button
									onClick={loginWithGoogle}
									className="px-4 py-2 text-sm flex items-center justify-center gap-2 btn-primary"
								>
									<LogIn className="h-4 w-4" aria-hidden />
									<span>Entrar com Google</span>
								</button>
							)}

							{/* Estado: logado, mas não Pro */}
							{!loading && isAuthenticated && !isPro && (
								<>
									<button
										type="button"
										onClick={handleSubscribeClick}
										disabled={creatingPreference}
										className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
									>
										{creatingPreference ? "Redirecionando..." : "Assinar Pro"}
									</button>

									{error && (
										<p className="text-xs text-red-400 text-right max-w-xs">
											{error}
										</p>
									)}
								</>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Rodapé de anúncio — só aparece quando rolar a página (somente no Free) */}
			{!isPro && <FreeAdFooter />}

			{/* Explicação da técnica Pomodoro */}
			<PomodoroExplanation />
		</main>
	);
}
