"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SocialLoginButtons } from "@/components/Auth/SocialLoginButtons";
import { useAuth } from "@/hooks/useAuth";
import { StatsOverviewModal } from "@/components/Stats/StatsOverviewModal";
import { useTheme } from "@/hooks/useTheme";
import { BarChart3, Moon, Settings, Sun } from "lucide-react";

export const MainHeader: React.FC = () => {
	function openSettings() {
		if (typeof window !== "undefined") {
			window.dispatchEvent(new Event("pomodoro:openSettings"));
		}
	}

	const { isPro, isAuthenticated, loading } = useAuth();
	const [isStatsOpen, setIsStatsOpen] = useState(false);
	const { isDark, toggleTheme } = useTheme();

	return (
		<>
			<header className="w-full border-b border-soft bg-background backdrop-blur-md">
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
						{/* CTA de plano Pro / gerenciamento */}
						{!loading && (
							<>
								{isAuthenticated && isPro && (
									<Link
										href="/pro/manage"
										className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:bg-soft transition-colors inline-flex items-center gap-1.5"
									>
										Gerenciar plano
									</Link>
								)}

								{(!isAuthenticated || !isPro) && (
									<Link
										href="/pro"
										className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:bg-soft transition-colors inline-flex items-center gap-1.5"
									>
										Seja Pro
									</Link>
								)}
							</>
						)}

						{/* Estatísticas – somente Pro */}
						{isPro && (
							<button
								type="button"
								onClick={() => setIsStatsOpen(true)}
								className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:bg-soft transition-colors inline-flex items-center gap-1.5"
							>
								<BarChart3 className="h-4 w-4" aria-hidden />
								Estatísticas
							</button>
						)}

						{/* Configurações */}
						<button
							type="button"
							onClick={openSettings}
							className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:bg-soft transition-colors inline-flex items-center gap-1.5"
						>
							<Settings className="h-4 w-4" aria-hidden />
							Configurações
						</button>

						{/* Toggle de tema */}
						<button
							type="button"
							onClick={toggleTheme}
							className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:bg-soft transition-colors inline-flex items-center gap-1.5"
						>
							{isDark ? (
								<Sun className="h-4 w-4" aria-hidden />
							) : (
								<Moon className="h-4 w-4" aria-hidden />
							)}
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
