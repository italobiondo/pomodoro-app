"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

			// se o tema atual não é permitido para Free, faz fallback
			if (!isThemeAllowedForUser(themeKey, false)) {
				// eslint-disable-next-line react-hooks/set-state-in-effect
				setThemeKeyState("dark");
			}
		}
	}, [isAuthenticated, isPro, themeKey]);

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

				if (isThemeKey(res.themeKey)) {
					// Pro pode aplicar qualquer tema registrado
					setThemeKeyState(res.themeKey);
				}
			} catch {
				// silêncio: fallback para localStorage
			}
		})();
	}, [isAuthenticated, isPro]);

	const setThemeKey = (next: ThemeKey) => {
		// Bloqueia premium para Free (segurança UX)
		if (!isThemeAllowedForUser(next, isPro)) return;

		setThemeKeyState(next);

		// Persistir no backend apenas se Pro (e autenticado)
		if (isAuthenticated && isPro && !savingRef.current) {
			savingRef.current = true;
			updateMyThemePreference({ themeKey: next })
				.catch(() => {
					// fallback: localStorage já foi atualizado
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
		isDark,
		toggleTheme,
		setThemeKey,
		allowedThemes, // útil para UI (dropdown)
		getThemeByKey, // útil para UI (label/icon)
	};
}
