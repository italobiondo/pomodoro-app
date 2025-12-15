import type React from "react";
import { Moon, Sparkles, Sun } from "lucide-react";

export const STORAGE_KEY_THEME = "pomodoro:themeKey";

export type ThemeKey = "light" | "dark" | "midnight" | "pomodoro-red";

export type ThemeDefinition = {
	key: ThemeKey;
	label: string;
	premium: boolean;
	icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

export const THEMES: ThemeDefinition[] = [
	{ key: "light", label: "Claro", premium: false, icon: Sun },
	{ key: "dark", label: "Escuro", premium: false, icon: Moon },
	{ key: "midnight", label: "Midnight", premium: true, icon: Sparkles },
	{ key: "pomodoro-red", label: "Pomodoro Red", premium: true, icon: Sparkles },
];

export function isThemeKey(v: unknown): v is ThemeKey {
	return typeof v === "string" && THEMES.some((t) => t.key === v);
}

export function getThemeByKey(key: ThemeKey): ThemeDefinition {
	const found = THEMES.find((t) => t.key === key);
	// Nunca deve acontecer porque ThemeKey é restrito.
	if (!found) return THEMES[0];
	return found;
}

export function isThemeAllowedForUser(key: ThemeKey, isPro: boolean): boolean {
	const theme = getThemeByKey(key);
	return isPro ? true : !theme.premium;
}
