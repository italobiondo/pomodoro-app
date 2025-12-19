"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./useAuth";
import {
	getMyThemePreference,
	updateMyThemePreference,
} from "../lib/apiClient";
import {
	STORAGE_KEY_THEME,
	type ThemeKey,
	THEMES,
	getThemeByKey,
	isThemeAllowedForUser,
	isThemeKey,
} from "../theme/themes";

function getInitialTheme(): ThemeKey {
	if (typeof window === "undefined") return "dark";

	const stored = window.localStorage.getItem(STORAGE_KEY_THEME);
	if (isThemeKey(stored)) return stored;

	const prefersDark = window.matchMedia?.(
		"(prefers-color-scheme: dark)"
	)?.matches;
	return prefersDark ? "dark" : "light";
}

function applyThemeToRoot(themeKey: ThemeKey) {
	const root = document.documentElement;

	for (const cls of Array.from(root.classList)) {
		if (cls.startsWith("theme-")) root.classList.remove(cls);
	}

	root.classList.add(`theme-${themeKey}`);
}

export function useTheme() {
	const { isPro, isAuthenticated } = useAuth();

	const [themeKey, setThemeKeyState] = useState<ThemeKey>(() =>
		getInitialTheme()
	);

	const didFetchRemoteRef = useRef(false);
	const savingRef = useRef(false);

	const [themeRemoteLoading, setThemeRemoteLoading] = useState(false);
	const [themeRemoteError, setThemeRemoteError] = useState<string | null>(null);

	const [themeSaving, setThemeSaving] = useState(false);
	const [themeSaveError, setThemeSaveError] = useState<string | null>(null);

	const saveRequestIdRef = useRef(0);
	const lastAttemptedThemeRef = useRef<ThemeKey | null>(null);

	const isDark = themeKey !== "light";

	const allowedThemes = useMemo(
		() => THEMES.filter((t) => (isPro ? true : !t.premium)),
		[isPro]
	);

	// aplica tema + salva local
	useEffect(() => {
		if (typeof window === "undefined") return;

		applyThemeToRoot(themeKey);
		window.localStorage.setItem(STORAGE_KEY_THEME, themeKey);
	}, [themeKey]);

	// quando muda auth/plano:
	// - se deslogar (ou deixar de ser Pro) e estiver em tema premium, volta para um tema permitido (dark)
	// - se voltar a logar como Pro, permite refetch do tema remoto
	useEffect(() => {
		if (typeof window === "undefined") return;

		// sempre que perder auth/pro, liberamos o refetch futuro
		if (!isAuthenticated || !isPro) {
			didFetchRemoteRef.current = false;
			setThemeRemoteError(null);
			setThemeSaveError(null);
			setThemeSaving(false);

			// se o tema atual não é permitido para Free, faz fallback
			if (!isThemeAllowedForUser(themeKey, false)) {
				setThemeKeyState("dark");
			}
		}
	}, [isAuthenticated, isPro, themeKey]);

	const refetchThemePreference = useCallback(async () => {
		if (!isAuthenticated || !isPro) return;

		setThemeRemoteLoading(true);
		setThemeRemoteError(null);

		try {
			const res = await getMyThemePreference();
			if (!res?.themeKey) return;

			if (isThemeKey(res.themeKey)) {
				setThemeKeyState(res.themeKey);
			}
		} catch {
			setThemeRemoteError("Não foi possível carregar sua preferência de tema.");
		} finally {
			setThemeRemoteLoading(false);
		}
	}, [isAuthenticated, isPro]);

	const persistThemePreference = useCallback(
		async (next: ThemeKey) => {
			if (!isAuthenticated || !isPro) return;

			// evita concorrência e mantém "última tentativa" para retry
			lastAttemptedThemeRef.current = next;

			const requestId = ++saveRequestIdRef.current;

			setThemeSaving(true);
			setThemeSaveError(null);

			try {
				await updateMyThemePreference({ themeKey: next });

				// só limpa se for a request mais recente
				if (saveRequestIdRef.current === requestId) {
					setThemeSaving(false);
					setThemeSaveError(null);
				}
			} catch {
				if (saveRequestIdRef.current === requestId) {
					setThemeSaving(false);
					setThemeSaveError(
						"Não foi possível salvar seu tema. Verifique sua conexão e tente novamente."
					);
				}
			}
		},
		[isAuthenticated, isPro]
	);

	const retrySaveThemeNow = useCallback(async () => {
		const key = lastAttemptedThemeRef.current ?? themeKey;
		await persistThemePreference(key);
	}, [persistThemePreference, themeKey]);

	// ao montar: se Pro, buscar preferências do backend
	useEffect(() => {
		if (!isAuthenticated || !isPro) return;
		if (didFetchRemoteRef.current) return;
		if (typeof window === "undefined") return;

		didFetchRemoteRef.current = true;
		void refetchThemePreference();
	}, [isAuthenticated, isPro, refetchThemePreference]);

	const setThemeKey = (next: ThemeKey) => {
		// Bloqueia premium para Free (segurança UX)
		if (!isThemeAllowedForUser(next, isPro)) return;

		setThemeKeyState(next);

		// Persistir no backend apenas se Pro (e autenticado)
		if (isAuthenticated && isPro && !savingRef.current) {
			savingRef.current = true;

			void persistThemePreference(next).finally(() => {
				savingRef.current = false;
			});
		}
	};

	const toggleTheme = () => {
		setThemeKey(themeKey === "dark" ? "light" : "dark");
	};

	return {
		themeKey,
		isDark,
		toggleTheme,
		setThemeKey,
		allowedThemes, // útil para UI (dropdown)
		getThemeByKey, // útil para UI (label/icon)
		themeRemoteLoading,
		themeRemoteError,
		themeSaving,
		themeSaveError,
		refetchThemePreference,
		retrySaveThemeNow,
	};
}
