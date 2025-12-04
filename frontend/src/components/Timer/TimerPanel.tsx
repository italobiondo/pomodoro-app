"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { TimerMode, useTimer } from "@/hooks/useTimer";
import { TimerSettingsModal } from "./TimerSettingsModal";

function formatTime(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const mm = String(minutes).padStart(2, "0");
	const ss = String(seconds).padStart(2, "0");
	return `${mm}:${ss}`;
}

function getModeLabel(mode: TimerMode) {
	switch (mode) {
		case "pomodoro":
			return "Pomodoro";
		case "short_break":
			return "Pausa curta";
		case "long_break":
			return "Pausa longa";
		default:
			return mode;
	}
}

export const TimerPanel: React.FC = () => {
	const {
		mode,
		remainingSeconds,
		isRunning,
		lastFinishedAt,
		settings,
		updateSettings,
		toggle,
		resetCurrent,
		switchMode,
		skipToNext,
	} = useTimer();

	const [soundEnabled, setSoundEnabled] = useState(true);
	const lastFinishedRef = useRef<number | null>(null);

	const [settingsOpen, setSettingsOpen] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const handler = () => setSettingsOpen(true);

		window.addEventListener("pomodoro:openSettings", handler);
		return () => {
			window.removeEventListener("pomodoro:openSettings", handler);
		};
	}, []);

	// Toca som simples quando um ciclo termina
	useEffect(() => {
		if (!soundEnabled) return;
		if (!lastFinishedAt) return;

		// Ignora primeira hidratação
		if (!lastFinishedRef.current) {
			lastFinishedRef.current = lastFinishedAt;
			return;
		}

		if (lastFinishedAt !== lastFinishedRef.current) {
			lastFinishedRef.current = lastFinishedAt;

			// Coloque o arquivo em: frontend/public/sounds/basic-notification.mp3
			const audio = new Audio("/sounds/basic-notification.mp3");
			audio.play().catch(() => {
				// Usuário pode ter bloqueado autoplay — apenas ignora
			});
		}
	}, [lastFinishedAt, soundEnabled]);

	const totalSecondsForCurrentMode = useMemo(() => {
		switch (mode) {
			case "pomodoro":
				return settings.pomodoroMinutes * 60;
			case "short_break":
				return settings.shortBreakMinutes * 60;
			case "long_break":
				return settings.longBreakMinutes * 60;
			default:
				return settings.pomodoroMinutes * 60;
		}
	}, [mode, settings]);

	const progress =
		totalSecondsForCurrentMode === 0
			? 0
			: 1 - remainingSeconds / totalSecondsForCurrentMode;

	return (
		<section className="w-full max-w-md mx-auto rounded-2xl bg-slate-900/80 text-slate-50 p-6 shadow-lg border border-slate-800">
			{/* Header / modos */}
			<header className="flex items-center justify-between mb-4">
				<div className="flex gap-2">
					{(["pomodoro", "short_break", "long_break"] as TimerMode[]).map(
						(m) => (
							<button
								key={m}
								type="button"
								onClick={() => switchMode(m)}
								className={`px-3 py-1 rounded-full text-sm border transition-all ${
									mode === m
										? "bg-slate-100 text-slate-900 border-slate-100"
										: "border-slate-600 text-slate-300 hover:border-slate-300"
								}`}
							>
								{getModeLabel(m)}
							</button>
						)
					)}
				</div>
			</header>

			{/* Timer */}
			<div className="flex flex-col items-center gap-4 mb-6">
				{/* Círculo simples com barra de progresso */}
				<div className="relative w-48 h-48 flex items-center justify-center">
					<svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
						<circle
							cx="50"
							cy="50"
							r="45"
							stroke="rgba(148, 163, 184, 0.35)"
							strokeWidth="6"
							fill="none"
						/>
						<circle
							cx="50"
							cy="50"
							r="45"
							stroke="white"
							strokeWidth="6"
							strokeLinecap="round"
							strokeDasharray={2 * Math.PI * 45}
							strokeDashoffset={(1 - progress) * 2 * Math.PI * 45}
							fill="none"
						/>
					</svg>
					<span className="absolute text-5xl font-semibold tabular-nums">
						{formatTime(remainingSeconds)}
					</span>
				</div>

				<button
					type="button"
					onClick={toggle}
					className="px-10 py-2 rounded-full text-lg font-semibold bg-slate-100 text-slate-900 hover:bg-white transition-colors"
				>
					{isRunning ? "Pausar" : "Iniciar"}
				</button>

				<div className="flex gap-3 text-xs text-slate-400">
					<button
						type="button"
						onClick={resetCurrent}
						className="hover:text-slate-200"
					>
						Resetar ciclo
					</button>
					<span>•</span>
					<button
						type="button"
						onClick={skipToNext}
						className="underline underline-offset-4 hover:text-slate-200"
					>
						Pular para o próximo
					</button>
				</div>
			</div>

			<TimerSettingsModal
				open={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				settings={settings}
				onChangeSettings={updateSettings}
				soundEnabled={soundEnabled}
				onChangeSoundEnabled={setSoundEnabled}
			/>
		</section>
	);
};
