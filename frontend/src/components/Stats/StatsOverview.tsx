"use client";

import { useStats } from "@/hooks/useStats";

export function StatsOverview() {
	const { stats, loading } = useStats();

	if (loading) return <div>Carregando estatísticas...</div>;
	if (!stats) return <div>Não foi possível carregar estatísticas.</div>;

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
