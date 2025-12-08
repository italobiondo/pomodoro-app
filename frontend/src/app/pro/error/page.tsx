"use client";

import { useRouter } from "next/navigation";
import { MainHeader } from "@/components/Layout/MainHeader";

export default function ProErrorPage() {
	const router = useRouter();

	function handleBackToPro() {
		router.push("/pro");
	}

	return (
		<main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
			<MainHeader />

			<div className="flex-1 flex items-center justify-center px-4">
				<div className="w-full max-w-md bg-slate-900/70 border border-red-800/70 rounded-2xl p-6 flex flex-col gap-4">
					<h1 className="text-xl font-semibold text-red-400">
						Houve um problema com o pagamento
					</h1>

					<p className="text-sm text-slate-300">
						O Mercado Pago retornou um erro ao processar o seu pagamento.
						Nenhuma cobrança foi realizada.
					</p>

					<p className="text-xs text-slate-500">
						Você pode tentar novamente em alguns instantes. Se o problema
						persistir, verifique seus dados de pagamento no Mercado Pago.
					</p>

					<button
						type="button"
						onClick={handleBackToPro}
						className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-slate-100 text-slate-900 hover:bg-white transition"
					>
						Voltar para página Pro
					</button>
				</div>
			</div>
		</main>
	);
}
