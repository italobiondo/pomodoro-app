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

			{/* Rodapé de anúncio — só aparece quando rolar a página (somente no Free) */}
			{!isPro && <FreeAdFooter />}

			{/* Explicação da técnica Pomodoro */}
			<PomodoroExplanation />
		</main>
	);
}
