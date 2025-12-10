"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { TimerMode, useTimer } from "@/hooks/useTimer";
import { TimerSettingsModal } from "./TimerSettingsModal";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";

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
		<section className="w-full max-w-md mx-auto card-main p-6 shadow-lg">
			{/* Header / modos */}
			<header className="mb-4">
				<div className="flex justify-center gap-2 flex-wrap">
					{(["pomodoro", "short_break", "long_break"] as TimerMode[]).map(
						(m) => (
							<button
								key={m}
								type="button"
								onClick={() => switchMode(m)}
								className={`px-3 py-1 rounded-full text-sm border transition-all min-w-[110px] text-center ${
									mode === m
										? "btn-primary shadow-sm"
										: "border-slate-300 text-muted hover:border-emerald-500 hover:text-secondary"
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
				<div className="relative w-48 h-48 flex items-center justify-center text-emerald-500">
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
							stroke="currentColor"
							strokeWidth="6"
							strokeLinecap="round"
							strokeDasharray={2 * Math.PI * 45}
							strokeDashoffset={(1 - progress) * 2 * Math.PI * 45}
							fill="none"
						/>
					</svg>
					<span className="absolute text-5xl font-semibold tabular-nums text-secondary">
						{formatTime(remainingSeconds)}
					</span>
				</div>

				<button
					type="button"
					onClick={toggle}
					className="px-10 py-2 rounded-full text-lg font-semibold btn-primary inline-flex items-center gap-2"
				>
					{isRunning ? (
						<>
							<Pause className="h-5 w-5" aria-hidden />
							Pausar
						</>
					) : (
						<>
							<Play className="h-5 w-5" aria-hidden />
							Iniciar
						</>
					)}
				</button>

				<div className="flex gap-3 text-xs text-muted">
					<button
						type="button"
						onClick={resetCurrent}
						className="underline underline-offset-4 hover:text-secondary inline-flex items-center gap-1"
					>
						<RotateCcw className="h-4 w-4" aria-hidden />
						Resetar ciclo
					</button>
					<span>•</span>
					<button
						type="button"
						onClick={skipToNext}
						className="underline underline-offset-4 hover:text-secondary inline-flex items-center gap-1"
					>
						<SkipForward className="h-4 w-4" aria-hidden />
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
