"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import { apiGet, apiPost, API_BASE_URL } from "../lib/apiClient";

export type PlanType = "free" | "pro";

export interface AuthUser {
	id: string;
	email: string;
	name?: string | null;
	plan: PlanType;
	planExpiresAt?: string | null;
}

interface AuthContextValue {
	user: AuthUser | null;
	loading: boolean;
	isPro: boolean;
	loginWithGoogle: () => void;
	logout: () => Promise<void>;
	refreshMe: () => Promise<void>;
	logoutSignal: number;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [logoutSignal, setLogoutSignal] = useState(0);

	const fetchMe = useCallback(async () => {
		setLoading(true);
		try {
			const me = await apiGet<AuthUser>("/auth/me");
			setUser(me);
		} catch {
			setUser(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchMe();
	}, [fetchMe]);

	const loginWithGoogle = () => {
		window.location.href = `${API_BASE_URL}/auth/google`;
	};

	const logout = async () => {
		try {
			await apiPost("/auth/logout");
			setUser(null);

			// 👇 notifica todos os hooks ligados ao auth
			setLogoutSignal((n) => n + 1);
		} catch {}
	};

	const value: AuthContextValue = {
		user,
		loading,
		isPro: user?.plan === "pro",
		loginWithGoogle,
		logout,
		refreshMe: fetchMe,
		logoutSignal,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return ctx;
}
