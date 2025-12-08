"use client";

export const FreeAdFooter = () => {
	return (
		<div className="w-full max-w-5xl mx-auto px-4 pb-8 mt-6">
			<section className="card-secondary px-4 py-3 text-xs text-muted">
				<p className="font-semibold text-secondary text-sm mb-1">
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
