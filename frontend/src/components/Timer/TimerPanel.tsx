"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { TimerMode, useTimer } from "@/hooks/useTimer";
import { TimerSettingsModal } from "./TimerSettingsModal";
import { Info, Pause, Play, RotateCcw, SkipForward } from "lucide-react";

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
		completedPomodoros,
		settings,
		updateSettings,
		toggle,
		resetCurrent,
		switchMode,
		skipToNext,
		resetSettingsToDefault,
	} = useTimer();

	const [soundEnabled, setSoundEnabled] = useState(true);

	// Controla som de fim de ciclo (pomodoro)
	const lastFinishedRef = useRef<number | null>(null);
	const prevCompletedPomodorosRef = useRef<number>(completedPomodoros);

	// Controla som de “faltam 5s para acabar a pausa”
	const breakWarningPlayedRef = useRef<boolean>(false);

	const [settingsOpen, setSettingsOpen] = useState(false);

	const settingsReturnFocusRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const handler = () => {
			// Guarda o elemento que estava com foco
			const active = document.activeElement;
			settingsReturnFocusRef.current =
				active instanceof HTMLElement ? active : null;

			setSettingsOpen(true);
		};

		window.addEventListener("pomodoro:openSettings", handler);
		return () => {
			window.removeEventListener("pomodoro:openSettings", handler);
		};
	}, []);

	// Som ao TERMINAR um POMODORO (fim do foco → início da pausa)
	useEffect(() => {
		if (!soundEnabled) return;
		if (!lastFinishedAt) return;

		// Primeira hidratação: apenas sincroniza refs
		if (lastFinishedRef.current === null) {
			lastFinishedRef.current = lastFinishedAt;
			prevCompletedPomodorosRef.current = completedPomodoros;
			return;
		}

		// Se não mudou o lastFinishedAt, não faz nada
		if (lastFinishedAt === lastFinishedRef.current) {
			return;
		}

		const prevCompleted = prevCompletedPomodorosRef.current ?? 0;

		lastFinishedRef.current = lastFinishedAt;
		prevCompletedPomodorosRef.current = completedPomodoros;

		// Se o número de pomodoros concluídos aumentou, significa que o ciclo finalizado foi um pomodoro
		const finishedPomodoro = completedPomodoros > prevCompleted;

		if (!finishedPomodoro) {
			// Ciclo finalizado foi uma pausa (short/long), não disparamos este som
			return;
		}

		// Arquivo sugerido: frontend/public/sounds/pomodoro-end.mp3
		const audio = new Audio("/sounds/pomodoro-end.mp3");
		audio.play().catch(() => {
			// Autoplay pode ser bloqueado — apenas ignora
		});
	}, [lastFinishedAt, completedPomodoros, soundEnabled]);

	// Som quando faltam 5 segundos para ACABAR a PAUSA (short ou long)
	useEffect(() => {
		if (!soundEnabled) return;
		if (typeof window === "undefined") return;

		const isBreak = mode === "short_break" || mode === "long_break";

		// Se mudou para modo foco, limpamos o flag
		if (!isBreak) {
			breakWarningPlayedRef.current = false;
			return;
		}

		// Enquanto estiver longe do fim, garantimos que o warning possa tocar depois
		if (remainingSeconds > 4) {
			breakWarningPlayedRef.current = false;
			return;
		}

		// Quando chegar exatamente em 5 segundos e ainda não tocamos o alerta, tocamos
		if (
			remainingSeconds <= 4 &&
			remainingSeconds > 0 &&
			!breakWarningPlayedRef.current
		) {
			breakWarningPlayedRef.current = true;

			// Arquivo sugerido: frontend/public/sounds/break-ending.mp3
			const audio = new Audio("/sounds/break-ending.wav");
			audio.play().catch(() => {
				// Autoplay pode ser bloqueado — apenas ignora
			});
		}
	}, [mode, remainingSeconds, soundEnabled]);

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

	const isBreak = mode === "short_break" || mode === "long_break";
	const isBreakEnding =
		isBreak && remainingSeconds <= 5 && remainingSeconds > 0;

	// Quando o usuário inicia um NOVO ciclo de pomodoro (cheio),
	// disparamos um evento global para o player tentar dar play.
	const handleToggleClick = () => {
		const wasRunning = isRunning;
		const isPomodoro = mode === "pomodoro";
		const isFullCycle =
			totalSecondsForCurrentMode > 0 &&
			remainingSeconds === totalSecondsForCurrentMode;

		toggle();

		if (
			!wasRunning && // estava parado e vai iniciar
			isPomodoro &&
			isFullCycle &&
			typeof window !== "undefined"
		) {
			window.dispatchEvent(new CustomEvent("pomodoro:focusPlayRequest"));
		}
	};

	return (
		<section
			className="w-full max-w-md mx-auto card-main p-6 shadow-lg"
			aria-label="Timer Pomodoro"
		>
			{/* Header / modos */}
			<header className="mb-4">
				<div className="flex justify-center gap-2 flex-wrap">
					{(["pomodoro", "short_break", "long_break"] as TimerMode[]).map(
						(m) => (
							<button
								key={m}
								type="button"
								onClick={() => switchMode(m)}
								aria-pressed={mode === m}
								className={`px-3 py-1 rounded-full text-sm border transition-all min-w-[110px] text-center ${
									mode === m
										? "btn-primary shadow-sm"
										: "border-soft text-muted hover:border-emerald-500 hover:text-secondary"
								}`}
							>
								<span className="inline-flex items-center gap-1">
									{getModeLabel(m)}
									{m === "long_break" ? (
										<span
											className="inline-flex items-center"
											title="Pausas longas acontecem a cada 4 pomodoros para ajudar na recuperação mental."
											aria-label="Informação sobre pausa longa"
										>
											<Info className="h-4 w-4 opacity-70" aria-hidden />
										</span>
									) : null}
								</span>
							</button>
						)
					)}
				</div>
			</header>

			{/* Timer */}
			<div className="flex flex-col items-center gap-4 mb-6">
				{/* Círculo simples com barra de progresso */}
				<div
					key={mode}
					className={[
						"relative w-48 h-48 flex items-center justify-center timer-ring",
						"timer-mode-transition",
						isBreakEnding ? "timer-soft-pulse" : "",
					].join(" ")}
				>
					<svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
						<circle
							cx="50"
							cy="50"
							r="45"
							className="timer-ring-track"
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
					onClick={handleToggleClick}
					aria-pressed={isRunning}
					aria-label={isRunning ? "Pausar timer" : "Iniciar timer"}
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
						className="underline underline-offset-4 hover:text-secondary inline-flex items-center gap-1 cursor-pointer"
					>
						<RotateCcw className="h-4 w-4" aria-hidden />
						Resetar ciclo
					</button>
					<span>•</span>
					<button
						type="button"
						onClick={skipToNext}
						className="underline underline-offset-4 hover:text-secondary inline-flex items-center gap-1 cursor-pointer"
					>
						<SkipForward className="h-4 w-4" aria-hidden />
						Pular para o próximo
					</button>
				</div>
			</div>

			<TimerSettingsModal
				open={settingsOpen}
				onClose={() => {
					setSettingsOpen(false);

					// Devolve o foco para o elemento que abriu o modal
					setTimeout(() => {
						settingsReturnFocusRef.current?.focus();
					}, 0);
				}}
				settings={settings}
				onChangeSettings={updateSettings}
				soundEnabled={soundEnabled}
				onChangeSoundEnabled={setSoundEnabled}
				onResetSettings={resetSettingsToDefault}
			/>
		</section>
	);
};
