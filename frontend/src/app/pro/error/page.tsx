"use client";

import { useRouter } from "next/navigation";
import { MainHeader } from "@/components/Layout/MainHeader";

export default function ProErrorPage() {
	const router = useRouter();

	function handleBackToPro() {
		router.push("/pro");
	}

	return (
		<main className="min-h-screen flex flex-col bg-background text-secondary">
			<MainHeader showSettings={false} />

			<div className="flex-1 flex items-center justify-center px-4">
				<div className="w-full max-w-md card-main border border-red-300/40 p-6 flex flex-col gap-4">
					<h1 className="text-xl font-semibold text-red-500">
						Houve um problema com o pagamento
					</h1>

					<p className="text-sm text-secondary">
						O Mercado Pago retornou um erro ao processar o seu pagamento.
						Nenhuma cobrança foi realizada.
					</p>

					<p className="text-xs text-muted">
						Você pode tentar novamente em alguns instantes. Se o problema
						persistir, verifique seus dados de pagamento no Mercado Pago.
					</p>

					<button
						type="button"
						onClick={handleBackToPro}
						className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium btn-primary"
					>
						Voltar para página Pro
					</button>
				</div>
			</div>
		</main>
	);
}
