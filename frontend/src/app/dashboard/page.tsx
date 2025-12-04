"use client";

import { StatsOverviewCard } from "@/components/dashboard/StatsOverviewCard";

export default function DashboardPage() {
	return (
		<main className="min-h-screen w-full bg-gradient-to from-zinc-950 via-zinc-950 to-black">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
				<header className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold text-zinc-50">Dashboard</h1>
					<p className="text-sm text-zinc-400">
						Veja um resumo das suas sessões de foco e tarefas concluídas.
					</p>
				</header>

				<section>
					<StatsOverviewCard />
				</section>

				{/* Espaço para futuros blocos: histórico, gráfico, etc. */}
			</div>
		</main>
	);
}
