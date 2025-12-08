"use client";

import React, { useState } from "react";
import { SocialLoginButtons } from "@/components/Auth/SocialLoginButtons";
import { useAuth } from "@/hooks/useAuth";
import { StatsOverviewModal } from "@/components/Stats/StatsOverviewModal";
import { useTheme } from "@/hooks/useTheme";

export const MainHeader: React.FC = () => {
	function openSettings() {
		if (typeof window !== "undefined") {
			window.dispatchEvent(new Event("pomodoro:openSettings"));
		}
	}

	const { isPro } = useAuth();
	const [isStatsOpen, setIsStatsOpen] = useState(false);
	const { isDark, toggleTheme } = useTheme();

	return (
		<>
			<header className="w-full border-b border-soft bg-background/80 backdrop-blur-md">
				<div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
					{/* Branding */}
					<div className="flex flex-col">
						<h1 className="text-lg font-semibold tracking-tight text-primary">
							Pomodoro Focus
						</h1>
						<p className="text-xs text-muted">
							• {isPro ? "Plano Pro" : "Plano Free"}
						</p>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-2">
						{/* Estatísticas – somente Pro */}
						{isPro && (
							<button
								type="button"
								onClick={() => setIsStatsOpen(true)}
								className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:bg-soft transition-colors"
							>
								Estatísticas
							</button>
						)}

						{/* Configurações */}
						<button
							type="button"
							onClick={openSettings}
							className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:bg-soft transition-colors"
						>
							Configurações
						</button>

						{/* Toggle de tema */}
						<button
							type="button"
							onClick={toggleTheme}
							className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:bg-soft transition-colors"
						>
							{isDark ? "Tema claro" : "Tema escuro"}
						</button>

						{/* Login / Conta */}
						<SocialLoginButtons compact />
					</div>
				</div>
			</header>

			{/* Modal */}
			<StatsOverviewModal
				open={isStatsOpen}
				onClose={() => setIsStatsOpen(false)}
			/>
		</>
	);
};
