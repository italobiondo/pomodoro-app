"use client";

import { useStatsOverview } from "@/hooks/useStatsOverview";

export function StatsOverviewCard() {
	const { data, loading, error } = useStatsOverview();

	if (loading) {
		return <p className="text-slate-400 text-sm">Carregando estatísticas…</p>;
	}

	if (error || !data) {
		return (
			<p className="text-red-400 text-sm">
				{error ?? "Erro ao carregar stats."}
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
				<div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
					<p className="text-[11px] uppercase tracking-wide text-slate-500">
						Pomodoros hoje
					</p>
					<p className="text-2xl font-semibold text-slate-50">
						{data.pomodorosToday}
					</p>
					<p className="text-[11px] text-slate-500">
						{data.focusMinutesToday} min
					</p>
				</div>

				<div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
					<p className="text-[11px] uppercase tracking-wide text-slate-500">
						Tasks concluídas
					</p>
					<p className="text-2xl font-semibold text-emerald-400">
						{data.tasksCompletedToday}
					</p>
				</div>

				<div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
					<p className="text-[11px] uppercase tracking-wide text-slate-500">
						Pomodoros (total)
					</p>
					<p className="text-2xl font-semibold text-slate-50">
						{data.totalPomodorosCompleted}
					</p>
				</div>

				<div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
					<p className="text-[11px] uppercase tracking-wide text-slate-500">
						Foco acumulado
					</p>
					<p className="text-2xl font-semibold text-slate-50">
						{data.totalFocusMinutes}
					</p>
				</div>

				<div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
					<p className="text-[11px] uppercase tracking-wide text-slate-500">
						Pausas acumuladas
					</p>
					<p className="text-2xl font-semibold text-slate-50">
						{data.totalBreakMinutes}
					</p>
				</div>
			</div>
		</div>
	);
}
