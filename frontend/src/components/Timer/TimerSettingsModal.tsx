"use client";

import React, { useEffect, useId, useRef } from "react";
import { Bell, Clock4, Repeat, X } from "lucide-react";

type TimerSettings = {
	pomodoroMinutes: number;
	shortBreakMinutes: number;
	longBreakMinutes: number;
	autoStartNext: boolean;
};

interface TimerSettingsModalProps {
	open: boolean;
	onClose: () => void;
	settings: TimerSettings;
	onChangeSettings: (patch: Partial<TimerSettings>) => void;
	soundEnabled: boolean;
	onChangeSoundEnabled: (value: boolean) => void;
	onResetSettings: () => void;
	settingsRemoteLoading?: boolean;
	settingsRemoteError?: string | null;
	settingsSaving?: boolean;
	settingsSaveError?: string | null;
	onRetryLoad?: () => void;
	onRetrySave?: () => void;
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

export const TimerSettingsModal: React.FC<TimerSettingsModalProps> = ({
	open,
	onClose,
	settings,
	onChangeSettings,
	soundEnabled,
	onChangeSoundEnabled,
	onResetSettings,
	settingsRemoteLoading = false,
	settingsRemoteError = null,
	settingsSaving = false,
	settingsSaveError = null,
	onRetryLoad,
	onRetrySave,
}) => {
	const titleId = useId();
	const contentRef = useRef<HTMLDivElement | null>(null);
	const firstInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (!open) return;

		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		// Foco inicial: primeiro input de tempo
		setTimeout(() => {
			firstInputRef.current?.focus();
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

	const pomodoroId = "timer-settings-pomodoro";
	const shortBreakId = "timer-settings-short-break";
	const longBreakId = "timer-settings-long-break";

	return (
		<div
			className="fixed inset-0 z-70 flex items-center justify-center bg-black/60"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				ref={contentRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className="w-full max-w-md card-main px-5 py-5 outline-none"
				tabIndex={-1}
			>
				<header className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2 text-primary">
						<Clock4 className="h-4 w-4" aria-hidden />
						<h2 id={titleId} className="text-sm font-semibold">
							Configurações
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-muted hover:text-secondary text-sm inline-flex ui-clickable"
						aria-label="Fechar configurações"
					>
						<X className="h-4 w-4" aria-hidden />
					</button>
				</header>

				{/* Estados de rede: /timer-settings/me */}
				{settingsRemoteLoading && (
					<div className="mb-3 card-secondary rounded-lg px-3 py-2">
						<p className="text-xs text-muted">Carregando configurações…</p>
					</div>
				)}

				{settingsRemoteError && (
					<div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-xs text-red-400 flex-1 min-w-0">
							{settingsRemoteError}
						</p>

						{onRetryLoad && (
							<button
								type="button"
								onClick={onRetryLoad}
								className="text-xs px-3 py-1.5 rounded-lg border border-soft text-secondary hover:bg-soft inline-flex items-center gap-1.5 ui-clickable whitespace-nowrap self-start sm:self-auto"
							>
								Tentar novamente
							</button>
						)}
					</div>
				)}

				{settingsSaving && (
					<div className="mb-3 card-secondary rounded-lg px-3 py-2">
						<p className="text-xs text-muted">Salvando alterações…</p>
					</div>
				)}

				{settingsSaveError && (
					<div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-xs text-red-400 flex-1 min-w-0">
							{settingsSaveError}
						</p>

						{onRetrySave && (
							<button
								type="button"
								onClick={onRetrySave}
								className="text-xs px-3 py-1.5 rounded-lg border border-soft text-secondary hover:bg-soft inline-flex items-center gap-1.5 ui-clickable whitespace-nowrap self-start sm:self-auto"
							>
								Salvar agora
							</button>
						)}
					</div>
				)}

				<div className="space-y-4 text-xs text-secondary">
					{/* Tempo (minutos) */}
					<section>
						<div className="flex items-center gap-2 text-secondary mb-2 text-[11px] font-semibold">
							<Clock4 className="h-4 w-4" aria-hidden />
							<span>Tempo (minutos)</span>
						</div>
						<div className="grid grid-cols-3 gap-3">
							<div className="flex flex-col gap-1">
								<label htmlFor={pomodoroId} className="text-[11px] text-muted">
									Pomodoro
								</label>
								<input
									ref={firstInputRef}
									id={pomodoroId}
									type="number"
									min={1}
									max={120}
									value={settings.pomodoroMinutes}
									onChange={(e) =>
										onChangeSettings({
											pomodoroMinutes: Number(e.target.value) || 1,
										})
									}
									className="rounded-md bg-background border border-soft px-2 py-1 text-xs text-secondary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label
									htmlFor={shortBreakId}
									className="text-[11px] text-muted"
								>
									Pausa curta
								</label>
								<input
									id={shortBreakId}
									type="number"
									min={1}
									max={60}
									value={settings.shortBreakMinutes}
									onChange={(e) =>
										onChangeSettings({
											shortBreakMinutes: Number(e.target.value) || 1,
										})
									}
									className="rounded-md bg-background border border-soft px-2 py-1 text-xs text-secondary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label htmlFor={longBreakId} className="text-[11px] text-muted">
									Pausa longa
								</label>
								<input
									id={longBreakId}
									type="number"
									min={1}
									max={60}
									value={settings.longBreakMinutes}
									onChange={(e) =>
										onChangeSettings({
											longBreakMinutes: Number(e.target.value) || 1,
										})
									}
									className="rounded-md bg-background border border-soft px-2 py-1 text-xs text-secondary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
								/>
							</div>
						</div>
					</section>

					{/* Comportamento do ciclo */}
					<section className="space-y-2">
						<div className="flex items-center gap-2 text-secondary text-[11px] font-semibold">
							<Repeat className="h-4 w-4" aria-hidden />
							<span>Ciclo</span>
						</div>

						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={settings.autoStartNext}
								onChange={(e) =>
									onChangeSettings({ autoStartNext: e.target.checked })
								}
								className="rounded border-soft bg-background accent-emerald-500"
							/>
							<span className="text-xs text-secondary">
								Iniciar automaticamente o próximo ciclo
							</span>
						</label>

						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={soundEnabled}
								onChange={(e) => onChangeSoundEnabled(e.target.checked)}
								className="rounded border-soft bg-background accent-emerald-500"
							/>
							<span className="inline-flex items-center gap-1 text-xs text-secondary">
								<Bell className="h-4 w-4" aria-hidden />
								Tocar som ao finalizar um ciclo
							</span>
						</label>
					</section>
				</div>

				<div className="mt-5 flex items-center justify-between">
					<button
						type="button"
						onClick={onResetSettings}
						className="px-3 py-1.5 rounded-lg text-xs border border-soft text-secondary hover:bg-soft inline-flex items-center gap-1.5 ui-clickable"
					>
						Resetar padrão
					</button>

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
};
