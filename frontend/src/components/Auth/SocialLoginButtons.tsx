"use client";

import { useAuth } from "../../hooks/useAuth";
import { LogIn, LogOut } from "lucide-react";

interface SocialLoginButtonsProps {
	compact?: boolean;
}

export function SocialLoginButtons({ compact }: SocialLoginButtonsProps) {
	const { loginWithGoogle, loading, user, logout } = useAuth();

	if (loading) {
		return (
			<button
				className="px-4 py-2 rounded-lg bg-soft border border-soft text-muted text-sm opacity-70 cursor-wait"
				disabled
			>
				Carregando...
			</button>
		);
	}

	if (user) {
		return (
			<div className="flex items-center gap-3 min-w-0">
				<span className="text-sm text-muted whitespace-nowrap truncate max-w-[180px]">
					Olá, {user.name || user.email}
				</span>

				<button
					onClick={logout}
					className="px-3 py-1 rounded-lg bg-soft border border-soft text-xs text-secondary hover:bg-soft transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
				>
					<LogOut className="h-4 w-4" aria-hidden />
					Sair
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<button
				onClick={loginWithGoogle}
				className="px-4 py-2 text-sm flex items-center justify-center gap-2 btn-primary"
			>
				<LogIn className="h-4 w-4" aria-hidden />
				<span>Entrar com Google</span>
			</button>

			{!compact && (
				<p className="text-[11px] text-muted text-center">
					Ao continuar, você acessa o plano Pro usando login social.
				</p>
			)}
		</div>
	);
}
