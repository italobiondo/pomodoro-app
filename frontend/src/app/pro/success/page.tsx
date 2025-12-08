"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MainHeader } from "@/components/Layout/MainHeader";
import { useAuth } from "@/hooks/useAuth";

export default function ProSuccessPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { refetch } = useAuth();

	const [refetched, setRefetched] = useState(false);

	const paymentId = searchParams.get("payment_id");
	const status = searchParams.get("status");
	const externalReference = searchParams.get("external_reference");

	useEffect(() => {
		// Ao entrar na página de sucesso, garantimos que o estado
		// de autenticação/assinatura seja atualizado.
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
		<main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
			<MainHeader />

			<div className="flex-1 flex items-center justify-center px-4">
				<div className="w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
					<h1 className="text-xl font-semibold text-emerald-400">
						Pagamento confirmado 🎉
					</h1>

					<p className="text-sm text-slate-300">
						Seu pagamento foi processado pelo Mercado Pago. Em alguns instantes
						seu plano Pro será atualizado no aplicativo.
					</p>

					{(paymentId || status || externalReference) && (
						<div className="text-xs text-slate-400 space-y-1">
							{paymentId && (
								<p>
									<span className="font-semibold">Payment ID:</span> {paymentId}
								</p>
							)}
							{status && (
								<p>
									<span className="font-semibold">Status recebido:</span>{" "}
									{status}
								</p>
							)}
							{externalReference && (
								<p>
									<span className="font-semibold">Ref. externa:</span>{" "}
									{externalReference}
								</p>
							)}
						</div>
					)}

					<p className="text-xs text-slate-500">
						Se seu plano ainda aparecer como Free, aguarde alguns segundos e
						clique no botão abaixo para voltar à página Pro.
					</p>

					<button
						type="button"
						onClick={handleGoToPro}
						className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-400 transition"
					>
						Ir para página Pro
					</button>
				</div>
			</div>
		</main>
	);
}
