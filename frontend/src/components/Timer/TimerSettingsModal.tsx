"use client";

import React from "react";
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
}

export const TimerSettingsModal: React.FC<TimerSettingsModalProps> = ({
	open,
	onClose,
	settings,
	onChangeSettings,
	soundEnabled,
	onChangeSoundEnabled,
}) => {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70">
			<div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-xl px-5 py-4">
				<header className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2 text-slate-100">
						<Clock4 className="h-4 w-4" aria-hidden />
						<h2 className="text-sm font-semibold">Configurações do timer</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="text-slate-400 hover:text-slate-100 text-sm inline-flex"
						aria-label="Fechar configura‡äes"
					>
						<X className="h-4 w-4" aria-hidden />
					</button>
				</header>

				<div className="space-y-4 text-xs text-slate-300">
					{/* Tempo (minutos) */}
					<section>
						<div className="flex items-center gap-2 text-slate-200 mb-2 text-[11px] font-semibold">
							<Clock4 className="h-4 w-4" aria-hidden />
							<span>Tempo (minutos)</span>
						</div>
						<div className="grid grid-cols-3 gap-3">
							<div className="flex flex-col gap-1">
								<label className="text-[11px] text-slate-400">Pomodoro</label>
								<input
									type="number"
									min={1}
									max={120}
									value={settings.pomodoroMinutes}
									onChange={(e) =>
										onChangeSettings({
											pomodoroMinutes: Number(e.target.value) || 1,
										})
									}
									className="rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-50"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label className="text-[11px] text-slate-400">
									Pausa curta
								</label>
								<input
									type="number"
									min={1}
									max={60}
									value={settings.shortBreakMinutes}
									onChange={(e) =>
										onChangeSettings({
											shortBreakMinutes: Number(e.target.value) || 1,
										})
									}
									className="rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-50"
								/>
							</div>

							<div className="flex flex-col gap-1">
								<label className="text-[11px] text-slate-400">
									Pausa longa
								</label>
								<input
									type="number"
									min={1}
									max={60}
									value={settings.longBreakMinutes}
									onChange={(e) =>
										onChangeSettings({
											longBreakMinutes: Number(e.target.value) || 1,
										})
									}
									className="rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-50"
								/>
							</div>
						</div>
					</section>

					{/* Comportamento do ciclo */}
					<section className="space-y-2">
						<div className="flex items-center gap-2 text-slate-200 text-[11px] font-semibold">
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
								className="rounded border-slate-600 bg-slate-900"
							/>
							<span className="text-xs text-slate-300">
								Iniciar automaticamente o próximo ciclo
							</span>
						</label>

						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={soundEnabled}
								onChange={(e) => onChangeSoundEnabled(e.target.checked)}
								className="rounded border-slate-600 bg-slate-900"
							/>
							<span className="inline-flex items-center gap-1 text-xs text-slate-300">
								<Bell className="h-4 w-4" aria-hidden />
								Tocar som ao finalizar um ciclo
							</span>
						</label>
					</section>
				</div>

				<div className="mt-5 flex justify-end">
					<button
						type="button"
						onClick={onClose}
						className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-100 border border-slate-600 hover:bg-slate-700 inline-flex items-center gap-1.5"
					>
						<X className="h-4 w-4" aria-hidden />
						Fechar
					</button>
				</div>
			</div>
		</div>
	);
};
