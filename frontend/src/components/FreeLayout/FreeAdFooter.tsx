"use client";

export const FreeAdFooter = () => {
	return (
		<div className="w-full max-w-5xl mx-auto px-4 pb-8 mt-6">
			<section className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-xs text-slate-400">
				<p className="font-semibold text-slate-200 text-sm mb-1">
					Anúncio leve aqui (Free)
				</p>
				<p className="mb-1">
					Espaço reservado para um anúncio discreto, sem distrações.
				</p>
				<ul className="list-disc list-inside space-y-1 text-[11px]">
					<li>Sem pop-ups.</li>
					<li>Sem banners piscando.</li>
					<li>Sempre respeitando o foco do usuário.</li>
				</ul>
			</section>
		</div>
	);
};
