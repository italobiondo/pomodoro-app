"use client";

import { useAuth } from "../../hooks/useAuth";

interface SocialLoginButtonsProps {
	compact?: boolean;
}

export function SocialLoginButtons({ compact }: SocialLoginButtonsProps) {
	const { loginWithGoogle, loading, user, logout } = useAuth();

	if (loading) {
		return (
			<button
				className="px-4 py-2 rounded-lg bg-slate-800 text-muted text-sm opacity-70 cursor-wait"
				disabled
			>
				Carregando...
			</button>
		);
	}

	if (user) {
		return (
			<div className="flex items-center gap-3">
				<span className="text-sm text-muted">
					Olá, {user.name || user.email}
				</span>
				<button
					onClick={logout}
					className="px-3 py-1 rounded-lg bg-slate-800 text-muted text-xs hover:bg-slate-700 transition"
				>
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
