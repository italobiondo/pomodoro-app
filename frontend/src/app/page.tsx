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
		<main className="min-h-screen flex flex-col">
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
				<div className="card-main p-4 sm:p-6">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						{/* Coluna esquerda: textos */}
						<div className="flex-1 space-y-2">
							<h2 className="text-lg sm:text-xl font-semibold">
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
									Você já é Pro 🎉 — em breve você poderá gerenciar sua
									assinatura em
									<span className="font-semibold"> /pro/manage</span>.
								</p>
							)}
						</div>

						{/* Coluna direita: CTA */}
						<div className="shrink-0 flex flex-col items-end gap-2">
							{/* Estado: não logado */}
							{!loading && !isAuthenticated && (
								<button
									type="button"
									onClick={loginWithGoogle}
									className="px-10 py-2 rounded-full text-lg font-semibold bg-emerald-500 text-white hover:bg-emerald-400 transition-colors"
								>
									Entrar com Google
								</button>
							)}

							{/* Estado: logado, mas não Pro */}
							{!loading && isAuthenticated && !isPro && (
								<>
									<button
										type="button"
										onClick={handleSubscribeClick}
										disabled={creatingPreference}
										className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
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

			{/* Explicação da técnica Pomodoro (abaixo da área útil) */}
			<section className="w-full max-w-4xl mx-auto mt-10 px-4 pt-4">
				<div className="card-secondary p-4 sm:p-6">
					<h2 className="text-lg sm:text-xl font-semibold mb-2 text-secondary">
						Como funciona a técnica Pomodoro
					</h2>
					<p className="text-sm text-muted mb-2">
						A técnica Pomodoro é um método simples de gerenciamento de tempo:
						você alterna blocos de foco intenso com pequenas pausas, para manter
						energia e concentração ao longo do dia.
					</p>
					<ul className="text-sm text-secondary list-disc list-inside space-y-1">
						<li>25 minutos de foco total (um “Pomodoro”).</li>
						<li>5 minutos de pausa curta entre cada ciclo.</li>
						<li>Após 4 ciclos, uma pausa longa para recarregar.</li>
					</ul>
					<p className="text-xs text-muted mt-3">
						Use o timer acima para controlar seus ciclos e acompanhe o seu ritmo
						de foco ao longo do tempo.
					</p>
				</div>
			</section>
		</main>
	);
}
