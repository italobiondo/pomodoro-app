"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import {
	getMyThemePreference,
	updateMyThemePreference,
} from "../lib/apiClient";

export type ThemeKey = "light" | "dark" | "midnight";

const STORAGE_KEY = "pomodoro:themeKey";

const FREE_ALLOWED: ThemeKey[] = ["light", "dark"];
const PRO_ALLOWED: ThemeKey[] = ["light", "dark", "midnight"];

function isThemeKey(v: unknown): v is ThemeKey {
	return v === "light" || v === "dark" || v === "midnight";
}

function getInitialTheme(): ThemeKey {
	if (typeof window === "undefined") return "dark";

	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (isThemeKey(stored)) return stored;

	const prefersDark = window.matchMedia?.(
		"(prefers-color-scheme: dark)"
	)?.matches;
	return prefersDark ? "dark" : "light";
}

function applyThemeToRoot(themeKey: ThemeKey) {
	const root = document.documentElement;

	// remove qualquer classe "theme-*"
	for (const cls of Array.from(root.classList)) {
		if (cls.startsWith("theme-")) root.classList.remove(cls);
	}

	root.classList.add(`theme-${themeKey}`);
}

export function useTheme() {
	const { isPro, isAuthenticated } = useAuth();

	const allowed = useMemo(() => (isPro ? PRO_ALLOWED : FREE_ALLOWED), [isPro]);

	const [themeKey, setThemeKeyState] = useState<ThemeKey>(() =>
		getInitialTheme()
	);

	const didHydrateRef = useRef(false);
	const didFetchRemoteRef = useRef(false);
	const savingRef = useRef(false);

	// aplica tema + salva local
	useEffect(() => {
		if (typeof window === "undefined") return;

		applyThemeToRoot(themeKey);
		window.localStorage.setItem(STORAGE_KEY, themeKey);

		didHydrateRef.current = true;
	}, [themeKey]);

	// ao montar: se Pro, buscar preferências do backend
	useEffect(() => {
		if (!isAuthenticated || !isPro) return;
		if (didFetchRemoteRef.current) return;
		if (typeof window === "undefined") return;

		didFetchRemoteRef.current = true;

		(async () => {
			try {
				const res = await getMyThemePreference();
				if (!res?.themeKey) return;

				// só aplica se for um ThemeKey suportado e permitido
				if (isThemeKey(res.themeKey) && PRO_ALLOWED.includes(res.themeKey)) {
					setThemeKeyState(res.themeKey);
				}
			} catch {
				// silêncio: fallback para localStorage
			}
		})();
	}, [isAuthenticated, isPro]);

	// setter “seguro” que valida permissão (Free x Pro) e opcionalmente persiste no backend
	const setThemeKey = (next: ThemeKey) => {
		if (!allowed.includes(next)) {
			// bloqueia premium para Free
			return;
		}

		setThemeKeyState(next);

		// se Pro, persistir (sem bloquear UI)
		if (isAuthenticated && isPro && !savingRef.current) {
			savingRef.current = true;
			updateMyThemePreference({ themeKey: next })
				.catch(() => {
					// se falhar, mantém localStorage como fallback
				})
				.finally(() => {
					savingRef.current = false;
				});
		}
	};

	const toggleTheme = () => {
		setThemeKey(themeKey === "dark" ? "light" : "dark");
	};

	return {
		themeKey,
		isDark: themeKey !== "light",
		toggleTheme,
		setThemeKey,
	};
}
