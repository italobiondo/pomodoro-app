"use client";

import { useStatsOverview } from "@/hooks/useStatsOverview";

export function StatsOverviewCard() {
	const { data, loading, error } = useStatsOverview();

	if (loading) {
		return (
			<div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
				<p className="text-sm text-zinc-400">Carregando estatísticas…</p>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="rounded-xl border border-red-800/60 bg-red-900/20 p-4">
				<p className="text-sm text-red-300">
					{error ?? "Erro ao carregar stats."}
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold text-zinc-50">
						Resumo do seu foco
					</h2>
					<p className="text-xs text-zinc-400">
						Estatísticas gerais e do dia de hoje
					</p>
				</div>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
				{/* Hoje */}
				<div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-4 flex flex-col gap-1">
					<span className="text-[11px] uppercase tracking-wide text-zinc-500">
						Pomodoros hoje
					</span>
					<span className="text-2xl font-semibold text-zinc-50">
						{data.pomodorosToday}
					</span>
					<span className="text-[11px] text-zinc-500">
						{data.focusMinutesToday} min de foco hoje
					</span>
				</div>

				<div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-4 flex flex-col gap-1">
					<span className="text-[11px] uppercase tracking-wide text-zinc-500">
						Tasks concluídas hoje
					</span>
					<span className="text-2xl font-semibold text-emerald-400">
						{data.tasksCompletedToday}
					</span>
					<span className="text-[11px] text-zinc-500">
						Tarefas marcadas como done
					</span>
				</div>

				{/* Totais */}
				<div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-4 flex flex-col gap-1">
					<span className="text-[11px] uppercase tracking-wide text-zinc-500">
						Pomodoros (total)
					</span>
					<span className="text-2xl font-semibold text-zinc-50">
						{data.totalPomodorosCompleted}
					</span>
					<span className="text-[11px] text-zinc-500">
						desde que começamos a registrar
					</span>
				</div>

				<div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-4 flex flex-col gap-1">
					<span className="text-[11px] uppercase tracking-wide text-zinc-500">
						Foco acumulado
					</span>
					<span className="text-2xl font-semibold text-zinc-50">
						{data.totalFocusMinutes}
					</span>
					<span className="text-[11px] text-zinc-500">minutos de foco</span>
				</div>

				<div className="rounded-xl bg-zinc-950/60 border border-zinc-800 p-4 flex flex-col gap-1">
					<span className="text-[11px] uppercase tracking-wide text-zinc-500">
						Pausas acumuladas
					</span>
					<span className="text-2xl font-semibold text-zinc-50">
						{data.totalBreakMinutes}
					</span>
					<span className="text-[11px] text-zinc-500">minutos de descanso</span>
				</div>
			</div>
		</div>
	);
}
