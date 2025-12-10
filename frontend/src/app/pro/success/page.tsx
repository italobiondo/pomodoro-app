"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainHeader } from "@/components/Layout/MainHeader";
import { useAuth } from "@/hooks/useAuth";

export default function ProSuccessPage() {
	const router = useRouter();
	const { refetch } = useAuth();
	const [refetched, setRefetched] = useState(false);

	useEffect(() => {
		if (!refetched) {
			refetch()
				.catch((err) => {
					console.error(
						"[/pro/success] Erro ao refazer fetch de auth/subscription",
						err
					);
				})
				.finally(() => setRefetched(true));
		}
	}, [refetched, refetch]);

	function handleGoToPro() {
		router.push("/pro");
	}

	return (
		<main className="min-h-screen flex flex-col bg-background text-secondary">
			<MainHeader showSettings={false} />

			<div className="flex-1 flex items-center justify-center px-4">
				<div className="w-full max-w-md card-main p-6 flex flex-col gap-4">
					<h1 className="text-xl font-semibold text-emerald-500">
						Pagamento confirmado! 🎉
					</h1>

					<p className="text-sm text-secondary">
						Seu pagamento foi processado pelo Mercado Pago. Em alguns instantes
						seu plano Pro será atualizado no aplicativo.
					</p>

					<p className="text-xs text-muted">
						Se seu plano ainda aparecer como Free, aguarde alguns segundos e
						clique no botão abaixo para voltar à página Pro e atualizar as
						informações.
					</p>

					<button
						type="button"
						onClick={handleGoToPro}
						className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium btn-primary"
					>
						Ir para página Pro
					</button>
				</div>
			</div>
		</main>
	);
}
