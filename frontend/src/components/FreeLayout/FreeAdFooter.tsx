"use client";

import { useEffect, useRef, useState } from "react";

declare global {
	interface Window {
		adsbygoogle?: unknown[];
	}
}

const ADS_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ADS_SLOT = process.env.NEXT_PUBLIC_ADSENSE_FOOTER_SLOT_ID;

export const FreeAdFooter = () => {
	const isConfigured = Boolean(ADS_CLIENT && ADS_SLOT);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [adLoading, setAdLoading] = useState(false);
	const [adError, setAdError] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (!isConfigured) return;

		// eslint-disable-next-line react-hooks/set-state-in-effect
		setAdError(null);
		setAdLoading(true);

		const container = containerRef.current;
		if (!container) return;

		// Se a largura ainda é 0, o layout não foi calculado.
		if (container.offsetWidth === 0) {
			// tenta novamente no próximo frame (layout ainda não calculado)
			requestAnimationFrame(() => {
				setAdLoading(false);
				setAdLoading(true);
			});
			return;
		}

		const ins = container.querySelector(
			"ins.adsbygoogle"
		) as HTMLModElement | null;

		if (!ins) return;

		// Se o AdSense já marcou o slot como preenchido, não chamamos de novo.
		const status = (ins as HTMLElement).dataset?.adsbygoogleStatus;
		if (status === "done") {
			setAdLoading(false);
			setAdError(null);

			return;
		}

		try {
			(window.adsbygoogle = window.adsbygoogle || []).push({});
		} catch (err) {
			console.error("[FreeAdFooter] Erro ao carregar anúncio Google", err);
			setAdLoading(false);
			setAdError("Não foi possível carregar o anúncio neste momento.");
		}
		// se não deu erro imediato, mantemos loading e deixamos o AdSense preencher
		// (não há callback confiável de "filled", então o loading é apenas informativo)
		setTimeout(() => {
			setAdLoading(false);
		}, 1200);
	}, [isConfigured]);

	return (
		<div className="w-full max-w-5xl mx-auto px-4 pb-8 mt-6">
			<section className="card-secondary px-4 py-3 text-xs text-muted">
				<p className="font-semibold text-secondary text-sm mb-1">
					{isConfigured ? "Patrocinado" : "Anúncio leve aqui (Free)"}
				</p>

				{isConfigured && adLoading && (
					<div
						className="mb-2 card-secondary rounded-lg px-3 py-2"
						role="status"
					>
						<p className="text-xs text-muted">Carregando anúncio…</p>
					</div>
				)}

				{isConfigured && adError && (
					<div
						className="mb-2 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2"
						role="alert"
					>
						<p className="text-xs text-red-400">{adError}</p>
						<p className="text-[11px] text-muted mt-1">
							O app continua funcionando normalmente.
						</p>
					</div>
				)}

				{isConfigured ? (
					adError ? (
						<p className="text-[11px] text-muted">
							Anúncio indisponível agora. Obrigado por apoiar usando o plano
							Free.
						</p>
					) : (
						<div className="w-full flex justify-center" ref={containerRef}>
							<ins
								className="adsbygoogle"
								style={{ display: "block" }}
								data-ad-client={ADS_CLIENT}
								data-ad-slot={ADS_SLOT}
								data-ad-format="auto"
								data-full-width-responsive="true"
							/>
						</div>
					)
				) : (
					<>
						<p className="mb-1">
							Espaço reservado para um anúncio discreto, sem distrações.
						</p>
						<ul className="list-disc list-inside space-y-1 text-[11px]">
							<li>Sem pop-ups.</li>
							<li>Sem banners piscando.</li>
							<li>Sempre respeitando o foco do usuário.</li>
						</ul>
					</>
				)}
			</section>
		</div>
	);
};
