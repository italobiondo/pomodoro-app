"use client";

import { useStats } from "@/hooks/useStats";

export function StatsOverview() {
	const { stats, loading, error, refetch } = useStats();

	if (loading) {
		return (
			<div className="card-secondary rounded-xl p-4">
				<p className="text-sm text-muted">Carregando estatísticas…</p>
			</div>
		);
	}

	if (error || !stats) {
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
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
			<Card
				label="Pomodoros concluídos"
				value={stats.totalPomodorosCompleted}
			/>
			<Card label="Minutos focados (total)" value={stats.totalFocusMinutes} />
			<Card label="Tarefas concluídas hoje" value={stats.tasksCompletedToday} />
		</div>
	);
}

function Card({ label, value }: { label: string; value: number }) {
	return (
		<div className="card-secondary p-4 text-center">
			<div className="text-sm text-muted">{label}</div>
			<div className="mt-2 text-3xl font-semibold text-primary">{value}</div>
		</div>
	);
}
