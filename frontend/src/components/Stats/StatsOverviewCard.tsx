"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ProLockPill } from "@/components/Pro/ProLockPill";
import { useStatsOverview } from "@/hooks/useStatsOverview";

export function StatsOverviewCard() {
	const router = useRouter();
	const { isPro } = useAuth();

	const { data, loading, error, refetch } = useStatsOverview({ enabled: isPro });

	if (!isPro) {
		return (
			<div className="card-main rounded-2xl p-6 flex flex-col gap-4">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<h2 className="text-lg font-semibold text-primary">
							Resumo do seu foco
						</h2>
						<p className="text-xs text-muted">
							Desbloqueie estatísticas detalhadas e evolução do seu desempenho.
						</p>
					</div>

					<ProLockPill locked />
				</div>

				<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm opacity-80">
					<div className="card-secondary rounded-xl p-4 flex flex-col gap-1">
						<span className="text-[11px] uppercase tracking-wide text-muted">
							Pomodoros hoje
						</span>
						<span className="text-2xl font-semibold text-primary">—</span>
						<span className="text-[11px] text-muted">min de foco hoje</span>
					</div>

					<div className="card-secondary rounded-xl p-4 flex flex-col gap-1">
						<span className="text-[11px] uppercase tracking-wide text-muted">
							Tasks concluídas hoje
						</span>
						<span className="text-2xl font-semibold text-primary">—</span>
						<span className="text-[11px] text-muted">
							tarefas marcadas como done
						</span>
					</div>

					<div className="card-secondary rounded-xl p-4 flex flex-col gap-1">
						<span className="text-[11px] uppercase tracking-wide text-muted">
							Foco acumulado
						</span>
						<span className="text-2xl font-semibold text-primary">—</span>
						<span className="text-[11px] text-muted">minutos de foco</span>
					</div>
				</div>

				<div className="flex items-center justify-between gap-3">
					<p className="text-xs text-muted">
						Prévia bloqueada: estatísticas completas no Pro.
					</p>

					<button
						type="button"
						onClick={() => router.push("/pro?src=stats_card")}
						className="text-xs px-3 py-1.5 rounded-lg border border-soft text-secondary hover:bg-soft inline-flex items-center gap-1.5 ui-clickable whitespace-nowrap"
					>
						Ver Pro
					</button>
				</div>
			</div>
		);
	}

	if (loading) {
		return <p className="text-sm text-muted">Carregando estatísticas…</p>;
	}

	if (error || !data) {
		return (
			<div className="rounded-xl border border-red-500/40 bg-red-500/5 p-4 flex items-start justify-between gap-3">
				<p className="text-sm text-red-400">
					{error ?? "Não foi possível carregar estatísticas."}
				</p>

				<button
					type="button"
					onClick={() => void refetch()}
					className="text-xs px-3 py-1.5 rounded-lg border border-soft text-secondary hover:bg-soft inline-flex items-center gap-1.5 ui-clickable whitespace-nowrap"
				>
					Tentar novamente
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
				<div className="card-secondary rounded-xl p-3">
					<p className="text-[11px] uppercase tracking-wide text-muted">
						Pomodoros hoje
					</p>
					<p className="text-2xl font-semibold text-primary">
						{data.pomodorosToday}
					</p>
					<p className="text-[11px] text-muted">{data.focusMinutesToday} min</p>
				</div>

				<div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
					<p className="text-[11px] uppercase tracking-wide text-muted">
						Tasks concluídas
					</p>
					<p className="text-2xl font-semibold text-emerald-400">
						{data.tasksCompletedToday}
					</p>
				</div>

				<div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
					<p className="text-[11px] uppercase tracking-wide text-muted">
						Pomodoros (total)
					</p>
					<p className="text-2xl font-semibold text-primary">
						{data.totalPomodorosCompleted}
					</p>
				</div>

				<div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
					<p className="text-[11px] uppercase tracking-wide text-muted">
						Foco acumulado
					</p>
					<p className="text-2xl font-semibold text-primary">
						{data.totalFocusMinutes}
					</p>
				</div>

				<div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3">
					<p className="text-[11px] uppercase tracking-wide text-muted">
						Pausas acumuladas
					</p>
					<p className="text-2xl font-semibold text-primary">
						{data.totalBreakMinutes}
					</p>
				</div>
			</div>
		</div>
	);
}
