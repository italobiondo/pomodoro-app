"use client";

import { useStats } from "@/hooks/useStats";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ProLockPill } from "@/components/Pro/ProLockPill";

export function StatsOverview() {
	const router = useRouter();
	const { isPro } = useAuth();
	const { stats, loading, error, refetch } = useStats({ enabled: isPro });

	if (!isPro) {
		return (
			<div className="card-secondary rounded-2xl p-5 flex flex-col gap-4">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="text-sm font-semibold text-primary">
							Estatísticas no Pro
						</p>
						<p className="text-xs text-muted mt-1">
							Acompanhe foco, pomodoros e consistência ao longo do tempo.
						</p>
					</div>

					<ProLockPill locked />
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-80">
					<div className="card-secondary p-4 text-center rounded-xl">
						<div className="text-sm text-muted">Pomodoros concluídos</div>
						<div className="mt-2 text-3xl font-semibold text-primary">—</div>
					</div>
					<div className="card-secondary p-4 text-center rounded-xl">
						<div className="text-sm text-muted">Minutos focados (total)</div>
						<div className="mt-2 text-3xl font-semibold text-primary">—</div>
					</div>
					<div className="card-secondary p-4 text-center rounded-xl">
						<div className="text-sm text-muted">Tarefas concluídas hoje</div>
						<div className="mt-2 text-3xl font-semibold text-primary">—</div>
					</div>
				</div>

				<div className="flex items-center justify-end">
					<button
						type="button"
						onClick={() => router.push("/pro?src=stats")}
						className="text-xs px-3 py-1.5 rounded-lg border border-soft text-secondary hover:bg-soft inline-flex items-center gap-1.5 ui-clickable whitespace-nowrap"
					>
						Ver Pro
					</button>
				</div>
			</div>
		);
	}

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
