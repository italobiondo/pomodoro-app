"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "pomodoro:theme";

function getInitialTheme(): Theme {
	if (typeof window === "undefined") {
		return "dark";
	}

	const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
	if (stored === "light" || stored === "dark") {
		return stored;
	}

	const prefersDark = window.matchMedia?.(
		"(prefers-color-scheme: dark)"
	)?.matches;
	return prefersDark ? "dark" : "light";
}

/**
 * Hook de tema simples:
 * - Lê/salva em localStorage
 * - Aplica classes `theme-light` / `theme-dark` no <html>
 * - Pode ser usado por qualquer componente client (ex: header)
 */
export function useTheme() {
	const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

	useEffect(() => {
		if (typeof window === "undefined") return;

		const root = document.documentElement;
		root.classList.remove("theme-light", "theme-dark");
		root.classList.add(theme === "light" ? "theme-light" : "theme-dark");

		window.localStorage.setItem(STORAGE_KEY, theme);
	}, [theme]);

	const toggleTheme = () => {
		setTheme((prev) => (prev === "light" ? "dark" : "light"));
	};

	return {
		theme,
		isDark: theme === "dark",
		toggleTheme,
		setTheme,
	};
}
