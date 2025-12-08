"use client";

import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { authClient } from "../lib/authClient";
import { User, SubscriptionStatusResponse } from "../types/user";

type AuthContextValue = {
	user: User | null;
	loading: boolean;
	error: string | null;
	isAuthenticated: boolean;
	isPro: boolean;
	logoutSignal: number;
	refetch: () => Promise<void>;
	logout: () => Promise<void>;
	loginWithGoogle: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function useProvideAuth(): AuthContextValue {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [logoutSignal, setLogoutSignal] = useState<number>(0);

	const fetchAuthAndSubscription = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			// 1) /auth/me - dados básicos do usuário autenticado
			const userRes = await authClient.get<User>("/auth/me");
			let currentUser = userRes.data;

			// 2) /subscriptions/me - status real de plano/assinatura
			try {
				const subRes = await authClient.get<SubscriptionStatusResponse>(
					"/subscriptions/me"
				);

				const sub = subRes.data;

				currentUser = {
					...currentUser,
					isPro: sub.isPro,
					plan: sub.plan,
					planStatus: sub.planStatus,
					planExpiresAt: sub.planExpiresAt,
					subscription: sub.subscription,
				};
			} catch (subError) {
				console.warn(
					"[useAuth] Não foi possível carregar /subscriptions/me, usando defaults FREE.",
					subError
				);

				currentUser = {
					...currentUser,
					isPro: false,
					plan: "FREE",
					planStatus: "ACTIVE",
					planExpiresAt: null,
					subscription: null,
				};
			}

			setUser(currentUser);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			console.error("[useAuth] Erro ao carregar /auth/me", err);
			setUser(null);

			// Se não for 401, guarda mensagem de erro
			if (err?.response?.status && err.response.status !== 401) {
				setError("Erro ao carregar autenticação");
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAuthAndSubscription();
	}, [fetchAuthAndSubscription]);

	const logout = useCallback(async () => {
		try {
			await authClient.post("/auth/logout");
		} catch (err) {
			console.error("[useAuth] Erro ao fazer logout", err);
		} finally {
			setUser(null);
			setLogoutSignal((prev) => prev + 1); // 👈 dispara sinal de logout
		}
	}, []);

	const loginWithGoogle = useCallback(() => {
		if (typeof window === "undefined") return;

		const backendBaseUrl =
			process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

		// Redireciona o usuário para o fluxo de OAuth do backend
		window.location.href = `${backendBaseUrl}/auth/google`;
	}, []);

	return {
		user,
		loading,
		error,
		isAuthenticated: !!user,
		isPro: !!user?.isPro,
		logoutSignal,
		refetch: fetchAuthAndSubscription,
		logout,
		loginWithGoogle,
	};
}

/**
 * Provider usado no layout.tsx para envolver toda a aplicação.
 */
export const AuthProvider: React.FC<React.PropsWithChildren> = ({
	children,
}) => {
	const value = useProvideAuth();
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook de conveniência para consumir o contexto de auth.
 */
export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth deve ser usado dentro de um AuthProvider");
	}
	return ctx;
}
