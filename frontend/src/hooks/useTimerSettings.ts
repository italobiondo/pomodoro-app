"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiGet, apiPut } from "@/lib/apiClient";

export type TimerSettings = {
	pomodoroDuration: number; // minutos
	shortBreakDuration: number; // minutos
	longBreakDuration: number; // minutos
	autoStart: boolean;
};

const STORAGE_KEY = "pomodoro:timerSettings:v1";

const DEFAULT_SETTINGS: TimerSettings = {
	pomodoroDuration: 25,
	shortBreakDuration: 5,
	longBreakDuration: 15,
	autoStart: false,
};

function loadFromLocalStorage(): TimerSettings {
	if (typeof window === "undefined") return DEFAULT_SETTINGS;

	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_SETTINGS;
		const parsed = JSON.parse(raw);

		return {
			...DEFAULT_SETTINGS,
			...parsed,
		};
	} catch {
		return DEFAULT_SETTINGS;
	}
}

function saveToLocalStorage(settings: TimerSettings) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useTimerSettings() {
	const { isPro, user, loading: authLoading } = useAuth();

	const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Carregar settings iniciais
	useEffect(() => {
		if (authLoading) return;

		// Usuário não logado ou plano Free → só localStorage
		if (!user || !isPro) {
			const local = loadFromLocalStorage();
			setSettings(local);
			setLoading(false);
			return;
		}

		// Plano Pro → buscar do backend
		(async () => {
			try {
				setLoading(true);
				setError(null);

				const data = await apiGet<TimerSettings>("/timer/settings");

				const merged: TimerSettings = {
					...DEFAULT_SETTINGS,
					...data,
				};

				setSettings(merged);
				// opcional: manter também no localStorage pra fallback
				saveToLocalStorage(merged);
			} catch (err) {
				console.error("Failed to load timer settings", err);
				// fallback para localStorage se houver
				const local = loadFromLocalStorage();
				setSettings(local);
				setError("Não foi possível carregar as configurações do timer.");
			} finally {
				setLoading(false);
			}
		})();
	}, [authLoading, isPro, user]);

	const updateSettings = useCallback(
		async (partial: Partial<TimerSettings>) => {
			setSettings((prev) => {
				const merged = { ...prev, ...partial };
				// Sempre salva local (Free + Pro)
				saveToLocalStorage(merged);
				return merged;
			});

			// Se não for Pro/logado, para por aqui
			if (!user || !isPro) return;

			try {
				setSaving(true);
				setError(null);

				const payload: Partial<TimerSettings> = partial;

				const updated = await apiPut<TimerSettings>("/timer/settings", payload);

				setSettings((prev) => {
					const merged = { ...prev, ...updated };
					saveToLocalStorage(merged);
					return merged;
				});
			} catch (err) {
				console.error("Failed to save timer settings", err);
				setError("Não foi possível salvar as configurações do timer.");
			} finally {
				setSaving(false);
			}
		},
		[isPro, user]
	);

	return {
		settings,
		loading,
		saving,
		error,
		updateSettings,
	};
}
