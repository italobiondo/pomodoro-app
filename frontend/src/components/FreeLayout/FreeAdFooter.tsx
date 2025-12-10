"use client";

import { useEffect, useState } from "react";

declare global {
	interface Window {
		adsbygoogle?: unknown[];
	}
}

const ADS_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ADS_SLOT = process.env.NEXT_PUBLIC_ADSENSE_FOOTER_SLOT_ID;

export const FreeAdFooter = () => {
	const [adsLoaded, setAdsLoaded] = useState(false);
	const isConfigured = Boolean(ADS_CLIENT && ADS_SLOT);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (!isConfigured) return;

		try {
			// Inicializa/atualiza o bloco de anúncio
			(window.adsbygoogle = window.adsbygoogle || []).push({});
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setAdsLoaded(true);
		} catch (err) {
			console.error("[FreeAdFooter] Erro ao carregar anúncio Google", err);
			setAdsLoaded(false);
		}
	}, [isConfigured]);

	return (
		<div className="w-full max-w-5xl mx-auto px-4 pb-8 mt-6">
			<section className="card-secondary px-4 py-3 text-xs text-muted">
				<p className="font-semibold text-secondary text-sm mb-1">
					{isConfigured ? "Patrocinado" : "Anúncio leve aqui (Free)"}
				</p>

				{isConfigured ? (
					<div className="w-full flex justify-center">
						<ins
							className="adsbygoogle"
							style={{ display: "block" }}
							data-ad-client={ADS_CLIENT}
							data-ad-slot={ADS_SLOT}
							data-ad-format="auto"
							data-full-width-responsive="true"
						/>
					</div>
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

				{isConfigured && !adsLoaded && (
					<p className="mt-2 text-[11px] text-muted">
						Carregando anúncio… sua experiência de foco permanece em primeiro
						lugar.
					</p>
				)}
			</section>
		</div>
	);
};
