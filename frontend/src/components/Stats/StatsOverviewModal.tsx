"use client";

import { StatsOverviewCard } from "@/components/dashboard/StatsOverviewCard";
import { BarChart3, X } from "lucide-react";

interface StatsOverviewModalProps {
	open: boolean;
	onClose: () => void;
}

export function StatsOverviewModal({ open, onClose }: StatsOverviewModalProps) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
			<div className="w-full max-w-2xl card-main rounded-2xl px-6 py-5">
				{/* Header */}
				<header className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2 text-primary">
						<BarChart3 className="h-5 w-5" aria-hidden />
						<h2 className="text-sm font-semibold">Resumo do seu foco</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-muted hover:text-secondary text-sm inline-flex"
						aria-label="Fechar estatísticas"
					>
						<X className="h-4 w-4" aria-hidden />
					</button>
				</header>

				{/* Conteιo */}
				<StatsOverviewCard />

				{/* Footer */}
				<div className="mt-5 flex justify-end">
					<button
						type="button"
						onClick={onClose}
						className="px-3 py-1.5 rounded-lg text-xs border border-soft text-secondary hover:bg-soft inline-flex items-center gap-1.5"
					>
						<X className="h-4 w-4" aria-hidden />
						Fechar
					</button>
				</div>
			</div>
		</div>
	);
}
