import { useEffect, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type TimerMode = "pomodoro" | "short_break" | "long_break";

export interface TimerSettings {
	pomodoroMinutes: number;
	shortBreakMinutes: number;
	longBreakMinutes: number;
	autoStartNext: boolean;
}

interface TimerState {
	mode: TimerMode;
	remainingSeconds: number;
	isRunning: boolean;
	lastUpdatedAt: number | null; // timestamp em ms
	completedPomodoros: number;
	lastFinishedAt: number | null; // para tocar som / confete
}

const TIMER_STATE_STORAGE_KEY = "pomodoro_timer_state_v1";
const TIMER_SETTINGS_STORAGE_KEY = "pomodoro_timer_settings_v1";

const DEFAULT_SETTINGS: TimerSettings = {
	pomodoroMinutes: 25,
	shortBreakMinutes: 5,
	longBreakMinutes: 15,
	autoStartNext: false,
};

function getDurationForMode(mode: TimerMode, settings: TimerSettings): number {
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
}

function getNextMode(
	current: TimerMode,
	completedPomodoros: number
): TimerMode {
	// Regra simples:
	// - Após pomodoro: 4º pomodoro => long break, senão short break
	// - Após qualquer break => volta pra pomodoro
	if (current === "pomodoro") {
		const isLongBreak = completedPomodoros > 0 && completedPomodoros % 4 === 0;
		return isLongBreak ? "long_break" : "short_break";
	}

	return "pomodoro";
}

function createInitialState(settings: TimerSettings): TimerState {
	return {
		mode: "pomodoro",
		remainingSeconds: getDurationForMode("pomodoro", settings),
		isRunning: false,
		lastUpdatedAt: null,
		completedPomodoros: 0,
		lastFinishedAt: null,
	};
}

type PersistedTimerState = {
	mode?: TimerMode;
	remainingSeconds?: number;
	isRunning?: boolean;
	lastUpdatedAt?: number | null;
	completedPomodoros?: number;
	lastFinishedAt?: number | null;
};

function rehydrateState(raw: unknown, settings: TimerSettings): TimerState {
	const data: PersistedTimerState =
		typeof raw === "object" && raw !== null ? (raw as PersistedTimerState) : {};

	const base: TimerState = {
		mode: data.mode ?? "pomodoro",
		remainingSeconds:
			typeof data.remainingSeconds === "number"
				? data.remainingSeconds
				: getDurationForMode(data.mode ?? "pomodoro", settings),
		isRunning: Boolean(data.isRunning),
		lastUpdatedAt:
			typeof data.lastUpdatedAt === "number" ? data.lastUpdatedAt : null,
		completedPomodoros:
			typeof data.completedPomodoros === "number" ? data.completedPomodoros : 0,
		lastFinishedAt:
			typeof data.lastFinishedAt === "number" ? data.lastFinishedAt : null,
	};

	if (!base.isRunning || !base.lastUpdatedAt) {
		const maxForMode = getDurationForMode(base.mode, settings);
		return {
			...base,
			remainingSeconds: Math.min(base.remainingSeconds, maxForMode),
		};
	}

	const now = Date.now();
	const elapsed = Math.floor((now - base.lastUpdatedAt) / 1000);
	const remaining = base.remainingSeconds - elapsed;

	if (remaining > 0) {
		return {
			...base,
			remainingSeconds: remaining,
			lastUpdatedAt: now,
		};
	}

	const completedPomodoros =
		base.mode === "pomodoro"
			? base.completedPomodoros + 1
			: base.completedPomodoros;

	const nextMode = getNextMode(base.mode, completedPomodoros);
	const nextDuration = getDurationForMode(nextMode, settings);

	return {
		mode: nextMode,
		remainingSeconds: nextDuration,
		isRunning: false,
		lastUpdatedAt: null,
		completedPomodoros,
		lastFinishedAt: now,
	};
}

export function useTimer() {
	const [settings, setSettings] = useLocalStorage<TimerSettings>(
		TIMER_SETTINGS_STORAGE_KEY,
		DEFAULT_SETTINGS
	);

	const [state, setState] = useState<TimerState>(() => {
		if (typeof window === "undefined") {
			// SSR / build
			return createInitialState(DEFAULT_SETTINGS);
		}

		try {
			const stored = window.localStorage.getItem(TIMER_STATE_STORAGE_KEY);
			if (!stored) {
				return createInitialState(DEFAULT_SETTINGS);
			}

			const parsed = JSON.parse(stored);
			return rehydrateState(parsed, DEFAULT_SETTINGS);
		} catch {
			return createInitialState(DEFAULT_SETTINGS);
		}
	});

	// Persiste estado do timer
	useEffect(() => {
		if (typeof window === "undefined") return;

		try {
			window.localStorage.setItem(
				TIMER_STATE_STORAGE_KEY,
				JSON.stringify(state)
			);
		} catch {
			// ignore
		}
	}, [state]);

	// Se o usuário mudar as configs e o timer estiver parado, ajusta a duração atual
	// A atualização foi movida para `updateSettings` para que seja feita explicitamente
	// quando o usuário alterar as configurações, evitando setState direto no efeito.

	// Loop de contagem
	useEffect(() => {
		if (!state.isRunning) return;
		if (typeof window === "undefined") return;

		const intervalId = window.setInterval(() => {
			setState((prev) => {
				if (!prev.isRunning) return prev;

				const now = Date.now();
				const last = prev.lastUpdatedAt ?? now;
				const elapsed = Math.floor((now - last) / 1000);

				if (elapsed <= 0) {
					return { ...prev, lastUpdatedAt: now };
				}

				const remaining = prev.remainingSeconds - elapsed;

				if (remaining > 0) {
					return {
						...prev,
						remainingSeconds: remaining,
						lastUpdatedAt: now,
					};
				}

				// Ciclo finalizado
				const completedPomodoros =
					prev.mode === "pomodoro"
						? prev.completedPomodoros + 1
						: prev.completedPomodoros;

				const base: TimerState = {
					...prev,
					remainingSeconds: 0,
					isRunning: false,
					lastUpdatedAt: now,
					completedPomodoros,
					lastFinishedAt: now,
				};

				const nextMode = getNextMode(prev.mode, completedPomodoros);
				const nextDuration = getDurationForMode(nextMode, settings);

				if (!settings.autoStartNext) {
					return {
						...base,
						mode: nextMode,
						remainingSeconds: nextDuration,
					};
				}

				// Auto-start do próximo ciclo
				return {
					...base,
					mode: nextMode,
					remainingSeconds: nextDuration,
					isRunning: true,
					lastUpdatedAt: now,
				};
			});
		}, 1000);

		return () => window.clearInterval(intervalId);
	}, [state.isRunning, settings]);

	// Actions expostas pro componente
	const start = () => {
		setState((prev) => {
			if (prev.isRunning) return prev;
			return {
				...prev,
				isRunning: true,
				lastUpdatedAt: Date.now(),
			};
		});
	};

	const pause = () => {
		setState((prev) => ({
			...prev,
			isRunning: false,
			lastUpdatedAt: null,
		}));
	};

	const toggle = () => {
		setState((prev) =>
			prev.isRunning
				? {
						...prev,
						isRunning: false,
						lastUpdatedAt: null,
				  }
				: {
						...prev,
						isRunning: true,
						lastUpdatedAt: Date.now(),
				  }
		);
	};

	const resetCurrent = () => {
		setState((prev) => ({
			...prev,
			remainingSeconds: getDurationForMode(prev.mode, settings),
			isRunning: false,
			lastUpdatedAt: null,
		}));
	};

	const switchMode = (mode: TimerMode) => {
		setState((prev) => ({
			...prev,
			mode,
			remainingSeconds: getDurationForMode(mode, settings),
			isRunning: false,
			lastUpdatedAt: null,
		}));
	};

	const skipToNext = () => {
		setState((prev) => {
			const completedPomodoros =
				prev.mode === "pomodoro"
					? prev.completedPomodoros + 1
					: prev.completedPomodoros;

			const nextMode = getNextMode(prev.mode, completedPomodoros);
			const nextDuration = getDurationForMode(nextMode, settings);

			return {
				...prev,
				mode: nextMode,
				remainingSeconds: nextDuration,
				isRunning: false,
				lastUpdatedAt: null,
				completedPomodoros,
				lastFinishedAt: Date.now(),
			};
		});
	};

	const updateSettings = (partial: Partial<TimerSettings>) => {
		setSettings((prev) => {
			const next = {
				...prev,
				...partial,
			};

			// Se o timer estiver parado, ajusta a duração atual de acordo com a nova config
			setState((current) => {
				if (current.isRunning) return current;
				const expected = getDurationForMode(current.mode, next);
				if (current.remainingSeconds === expected) return current;
				return {
					...current,
					remainingSeconds: expected,
				};
			});

			return next;
		});
	};

	return {
		// estado
		mode: state.mode,
		remainingSeconds: state.remainingSeconds,
		isRunning: state.isRunning,
		completedPomodoros: state.completedPomodoros,
		lastFinishedAt: state.lastFinishedAt,

		// configs
		settings,
		updateSettings,

		// ações
		start,
		pause,
		toggle,
		resetCurrent,
		switchMode,
		skipToNext,
	};
}
