"use client";

import { useEffect, useId, useRef } from "react";
import { StatsOverviewCard } from "@/components/dashboard/StatsOverviewCard";
import { BarChart3, X } from "lucide-react";

interface StatsOverviewModalProps {
	open: boolean;
	onClose: () => void;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
	const selector = [
		'a[href]:not([tabindex="-1"])',
		'button:not([disabled]):not([tabindex="-1"])',
		'input:not([disabled]):not([tabindex="-1"])',
		'select:not([disabled]):not([tabindex="-1"])',
		'textarea:not([disabled]):not([tabindex="-1"])',
		'[tabindex]:not([tabindex="-1"])',
	].join(",");

	return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
		(el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
	);
}

export function StatsOverviewModal({ open, onClose }: StatsOverviewModalProps) {
	const titleId = useId();
	const contentRef = useRef<HTMLDivElement | null>(null);
	const closeBtnRef = useRef<HTMLButtonElement | null>(null);

	useEffect(() => {
		if (!open) return;

		// Bloqueia scroll do body enquanto modal estiver aberto
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		// Foco inicial: preferir botão de fechar
		setTimeout(() => {
			closeBtnRef.current?.focus();
		}, 0);

		function onKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
				return;
			}

			if (e.key !== "Tab") return;

			const root = contentRef.current;
			if (!root) return;

			const focusables = getFocusableElements(root);
			if (focusables.length === 0) return;

			const first = focusables[0];
			const last = focusables[focusables.length - 1];
			const active = document.activeElement;

			if (e.shiftKey) {
				if (active === first || active === root) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (active === last) {
					e.preventDefault();
					first.focus();
				}
			}
		}

		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("keydown", onKeyDown);
			document.body.style.overflow = prevOverflow;
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-80 flex items-center justify-center bg-black/60"
			onMouseDown={(e) => {
				// fecha ao clicar no backdrop (fora do conteúdo)
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				ref={contentRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className="w-full max-w-2xl card-main rounded-2xl px-6 py-5 outline-none"
				tabIndex={-1}
			>
				{/* Header */}
				<header className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2 text-primary">
						<BarChart3 className="h-5 w-5" aria-hidden />
						<h2 id={titleId} className="text-sm font-semibold">
							Resumo do seu foco
						</h2>
					</div>
					<button
						ref={closeBtnRef}
						type="button"
						onClick={onClose}
						className="text-muted hover:text-secondary text-sm inline-flex ui-clickable"
						aria-label="Fechar estatísticas"
					>
						<X className="h-4 w-4" aria-hidden />
					</button>
				</header>

				{/* Conteúdo */}
				<StatsOverviewCard />

				{/* Footer */}
				<div className="mt-5 flex justify-end">
					<button
						type="button"
						onClick={onClose}
						className="px-3 py-1.5 rounded-lg text-xs border border-soft text-secondary hover:bg-soft inline-flex items-center gap-1.5 ui-clickable"
					>
						<X className="h-4 w-4" aria-hidden />
						Fechar
					</button>
				</div>
			</div>
		</div>
	);
}
