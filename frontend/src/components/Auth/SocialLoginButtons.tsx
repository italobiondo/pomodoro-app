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
				className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm opacity-70 cursor-wait"
				disabled
			>
				Carregando...
			</button>
		);
	}

	if (user) {
		return (
			<div className="flex items-center gap-3">
				<span className="text-sm text-slate-300">
					Olá, {user.name || user.email}
				</span>
				<button
					onClick={logout}
					className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs hover:bg-slate-700 transition"
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
				className="px-4 py-2 rounded-lg bg-white text-slate-900 text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-100 transition"
			>
				<span>Entrar com Google</span>
			</button>

			{!compact && (
				<p className="text-[11px] text-slate-400 text-center">
					Ao continuar, você acessa o plano Pro usando login social.
				</p>
			)}
		</div>
	);
}
