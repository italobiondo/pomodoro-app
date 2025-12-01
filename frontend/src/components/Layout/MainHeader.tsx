"use client";

import React from "react";
import { SocialLoginButtons } from "@/components/Auth/SocialLoginButtons";

export const MainHeader: React.FC = () => {
	function openSettings() {
		if (typeof window !== "undefined") {
			window.dispatchEvent(new Event("pomodoro:openSettings"));
		}
	}

	return (
		<header className="w-full border-b border-slate-800">
			<div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
				<div className="flex flex-col">
					<h1 className="text-lg font-semibold tracking-tight">
						Pomodoro Focus
					</h1>
					<p className="text-xs text-slate-400">• Plano Free</p>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={openSettings}
						className="text-xs px-3 py-1.5 rounded-full border border-slate-600 text-slate-200 hover:border-slate-300 hover:text-slate-50 transition-colors"
					>
						Configurações
					</button>

					{/* Botão de login / conta Pro via login social */}
					<SocialLoginButtons compact />
				</div>
			</div>
		</header>
	);
};
