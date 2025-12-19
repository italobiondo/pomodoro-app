"use client";

import { useStatsOverview } from "@/hooks/useStatsOverview";

export function StatsOverviewCard() {
	const { data, loading, error, refetch } = useStatsOverview();

	if (loading) {
		return (
			<div className="card-secondary rounded-xl p-4">
				<p className="text-sm text-muted">Carregando estatísticas…</p>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="rounded-xl border border-red-500/40 bg-red-500/5 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm text-red-400 flex-1 min-w-0">
					{error ?? "Não foi possível carregar estatísticas."}
				</p>

				<button
					type="button"
					onClick={() => void refetch()}
					className="text-xs px-3 py-1.5 rounded-lg border border-soft text-secondary hover:bg-soft inline-flex items-center gap-1.5 ui-clickable whitespace-nowrap self-start sm:self-auto"
				>
					Tentar novamente
				</button>
			</div>
		);
	}

	return (
		<div className="card-main rounded-2xl p-6 flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold text-primary">
						Resumo do seu foco
					</h2>
					<p className="text-xs text-muted">
						Estatísticas gerais e do dia de hoje
					</p>
				</div>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
				{/* Hoje */}
				<div className="card-secondary rounded-xl p-4 flex flex-col gap-1">
					<span className="text-[11px] uppercase tracking-wide text-muted">
						Pomodoros hoje
					</span>
					<span className="text-2xl font-semibold text-primary">
						{data.pomodorosToday}
					</span>
					<span className="text-[11px] text-muted">
						{data.focusMinutesToday} min de foco hoje
					</span>
				</div>

				<div className="card-secondary rounded-xl p-4 flex flex-col gap-1">
					<span className="text-[11px] uppercase tracking-wide text-muted">
						Tasks concluídas hoje
					</span>
					<span className="text-2xl font-semibold text-emerald-400">
						{data.tasksCompletedToday}
					</span>
					<span className="text-[11px] text-muted">
						Tarefas marcadas como done
					</span>
				</div>

				{/* Totais */}
				<div className="card-secondary rounded-xl p-4 flex flex-col gap-1">
					<span className="text-[11px] uppercase tracking-wide text-muted">
						Pomodoros (total)
					</span>
					<span className="text-2xl font-semibold text-primary">
						{data.totalPomodorosCompleted}
					</span>
					<span className="text-[11px] text-muted">
						desde que começamos a registrar
					</span>
				</div>

				<div className="card-secondary rounded-xl p-4 flex flex-col gap-1">
					<span className="text-[11px] uppercase tracking-wide text-muted">
						Foco acumulado
					</span>
					<span className="text-2xl font-semibold text-primary">
						{data.totalFocusMinutes}
					</span>
					<span className="text-[11px] text-muted">minutos de foco</span>
				</div>

				<div className="card-secondary rounded-xl p-4 flex flex-col gap-1">
					<span className="text-[11px] uppercase tracking-wide text-muted">
						Pausas acumuladas
					</span>
					<span className="text-2xl font-semibold text-primary">
						{data.totalBreakMinutes}
					</span>
					<span className="text-[11px] text-muted">minutos de descanso</span>
				</div>
			</div>
		</div>
	);
}
