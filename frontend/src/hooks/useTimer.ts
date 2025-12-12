import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useAuth } from "./useAuth";
import { apiGet, apiPost, apiPut } from "../lib/apiClient";

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

type FocusSessionApiResponse = {
	id: string;
	startedAt: string;
	endedAt: string | null;
	focusMinutes: number;
	breakMinutes: number;
};

type RemoteTimerState = {
	mode: TimerMode;
	remainingSeconds: number;
	isRunning: boolean;
	lastUpdatedAt: string | null;
	completedPomodoros: number;
	lastFinishedAt: string | null;
	clientUpdatedAt: string | null;
};

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
	const { isPro } = useAuth();

	const [settings, setSettings] = useLocalStorage<TimerSettings>(
		TIMER_SETTINGS_STORAGE_KEY,
		DEFAULT_SETTINGS
	);

	const [state, setState] = useState<TimerState>(() => {
		// SSR / build
		if (typeof window === "undefined") {
			return createInitialState(settings);
		}

		try {
			const stored = window.localStorage.getItem(TIMER_STATE_STORAGE_KEY);
			if (!stored) {
				return createInitialState(settings);
			}

			const parsed = JSON.parse(stored);
			return rehydrateState(parsed, settings);
		} catch {
			return createInitialState(settings);
		}
	});

	// 🔹 Pro: hidrata estado do timer a partir do backend (multi-dispositivo)
	useEffect(() => {
		if (!isPro) return;
		if (typeof window === "undefined") return;

		let cancelled = false;

		(async () => {
			try {
				const remote = await apiGet<RemoteTimerState | null>("/timer-state");
				if (!remote || cancelled) return;

				setState((local) => {
					const localUpdated = local.lastUpdatedAt ?? 0;

					const remoteUpdated = remote.clientUpdatedAt
						? new Date(remote.clientUpdatedAt).getTime()
						: 0;

					// Se remoto for mais recente, aplica
					if (remoteUpdated > localUpdated) {
						return {
							mode: remote.mode,
							remainingSeconds: remote.remainingSeconds,
							isRunning: remote.isRunning,
							lastUpdatedAt: remote.lastUpdatedAt
								? new Date(remote.lastUpdatedAt).getTime()
								: null,
							completedPomodoros: remote.completedPomodoros,
							lastFinishedAt: remote.lastFinishedAt
								? new Date(remote.lastFinishedAt).getTime()
								: null,
						};
					}

					return local;
				});
			} catch {
				// Falha de rede não quebra o timer
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [isPro]);

	// 🔹 ID da sessão de foco atual (apenas Pro e pomodoro)
	const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

	// Refs para detectar "transições" de conclusão de ciclo
	const lastFinishedAtRef = useRef<number | null>(state.lastFinishedAt);
	const lastCompletedPomodorosRef = useRef<number>(state.completedPomodoros);

	const postEvent = (
		type:
			| "POMODORO_FINISHED"
			| "CYCLE_SKIPPED"
			| "BREAK_SKIPPED"
			| "RESET_CURRENT",
		metadata?: Record<string, unknown>
	) => {
		if (!isPro) return;
		if (!currentSessionId) return;

		apiPost(`/stats/focus-sessions/${currentSessionId}/events`, {
			type,
			metadata,
		}).catch(() => {
			// não impacta o timer
		});
	};

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

	// 🔹 Pro: sincroniza estado do timer com backend (debounce)
	const syncTimeoutRef = useRef<number | null>(null);

	useEffect(() => {
		if (!isPro) return;
		if (typeof window === "undefined") return;

		if (syncTimeoutRef.current) {
			window.clearTimeout(syncTimeoutRef.current);
		}

		syncTimeoutRef.current = window.setTimeout(async () => {
			try {
				await apiPut("/timer-state", {
					mode: state.mode,
					remainingSeconds: state.remainingSeconds,
					isRunning: state.isRunning,
					lastUpdatedAt: state.lastUpdatedAt,
					completedPomodoros: state.completedPomodoros,
					lastFinishedAt: state.lastFinishedAt,
					clientUpdatedAt: new Date().toISOString(),
				});
			} catch {
				// Ignora erro de sync
			}
		}, 5000);

		return () => {
			if (syncTimeoutRef.current) {
				window.clearTimeout(syncTimeoutRef.current);
			}
		};
	}, [isPro, state]);

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

				if (prev.mode === "pomodoro") {
					queueMicrotask(() => {
						postEvent("POMODORO_FINISHED", {
							mode: prev.mode,
						});
					});
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

	// 🔹 Efeito 1: detectar INÍCIO de um pomodoro (Pro) e abrir sessão no backend
	useEffect(() => {
		if (!isPro) return;
		if (typeof window === "undefined") return;

		const isPomodoro = state.mode === "pomodoro";
		if (!isPomodoro) return;
		if (!state.isRunning) return;
		if (currentSessionId) return; // já existe sessão aberta

		const fullDuration = getDurationForMode("pomodoro", settings);

		// Queremos só quando começa um novo pomodoro, não quando retoma no meio.
		const delta = fullDuration - state.remainingSeconds;
		if (delta < 0 || delta > 1) {
			// Se já passou mais de 1s do início "cheio", não abrimos sessão nova.
			return;
		}

		// Chama o backend para iniciar sessão
		(async () => {
			try {
				const res = await apiPost<FocusSessionApiResponse>(
					"/stats/focus-sessions/start",
					{
						plannedFocusMinutes: settings.pomodoroMinutes,
						plannedBreakMinutes: settings.shortBreakMinutes,
					}
				);

				setCurrentSessionId(res.id);
			} catch (err) {
				// Se falhar, não vamos atrapalhar o timer
				console.error("Failed to start focus session", err);
				setCurrentSessionId(null);
			}
		})();
	}, [
		isPro,
		state.mode,
		state.isRunning,
		state.remainingSeconds,
		settings,
		currentSessionId,
	]);

	// 🔹 Efeito 2: detectar FIM de um pomodoro (Pro) e fechar sessão no backend
	useEffect(() => {
		if (!isPro) return;
		if (typeof window === "undefined") return;
		if (!state.lastFinishedAt) return;

		const prevFinishedAt = lastFinishedAtRef.current;
		const prevCompletedPomodoros = lastCompletedPomodorosRef.current;

		// Só entra quando houve alteração de lastFinishedAt
		if (prevFinishedAt === state.lastFinishedAt) return;

		const pomodoroCountIncreased =
			state.completedPomodoros > prevCompletedPomodoros;

		lastFinishedAtRef.current = state.lastFinishedAt;
		lastCompletedPomodorosRef.current = state.completedPomodoros;

		if (!pomodoroCountIncreased) {
			// ciclo finalizado não foi um pomodoro (pode ter sido break)
			return;
		}

		if (!currentSessionId) {
			// Não temos sessão aberta (por exemplo, usuário recarregou a página durante o ciclo)
			return;
		}

		(async () => {
			try {
				await apiPost<FocusSessionApiResponse>(
					`/stats/focus-sessions/${currentSessionId}/finish`,
					{
						// Não enviamos focusMinutes/endedAt => backend calcula pelo startedAt → now
						// breakMinutes poderia ser enviado aqui no futuro (pós-break).
					}
				);
			} catch (err) {
				console.error("Failed to finish focus session", err);
			} finally {
				// Em qualquer caso, limpamos a sessão atual
				setCurrentSessionId(null);
			}
		})();
	}, [isPro, state.lastFinishedAt, state.completedPomodoros, currentSessionId]);

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
		// Fire-and-forget fora do setState (não travar timer)
		queueMicrotask(() => {
			postEvent("RESET_CURRENT", { mode: state.mode });
		});

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
		queueMicrotask(() => {
			const isBreak =
				state.mode === "short_break" || state.mode === "long_break";
			postEvent(isBreak ? "BREAK_SKIPPED" : "CYCLE_SKIPPED", {
				mode: state.mode,
			});
		});

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
