"use client";

import { StatsOverviewCard } from "@/components/dashboard/StatsOverviewCard";

interface StatsOverviewModalProps {
	open: boolean;
	onClose: () => void;
}

export function StatsOverviewModal({ open, onClose }: StatsOverviewModalProps) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70">
			<div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-xl px-6 py-5">
				{/* Header */}
				<header className="flex items-center justify-between mb-4">
					<h2 className="text-sm font-semibold text-slate-100">
						Resumo do seu foco
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 hover:text-slate-100 text-sm"
						aria-label="Fechar estatísticas"
					>
						✕
					</button>
				</header>

				{/* Conteúdo */}
				<StatsOverviewCard />

				{/* Footer */}
				<div className="mt-5 flex justify-end">
					<button
						type="button"
						onClick={onClose}
						className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-100 border border-slate-600 hover:bg-slate-700"
					>
						Fechar
					</button>
				</div>
			</div>
		</div>
	);
}
