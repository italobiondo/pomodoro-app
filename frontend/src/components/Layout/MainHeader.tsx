"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SocialLoginButtons } from "@/components/Auth/SocialLoginButtons";
import { useAuth } from "@/hooks/useAuth";
import { StatsOverviewModal } from "@/components/Stats/StatsOverviewModal";
import { useTheme } from "@/hooks/useTheme";
import {
	BarChart3,
	Crown,
	Home,
	Menu,
	Moon,
	Sparkles,
	Sun,
	Settings,
	X,
} from "lucide-react";

type MainHeaderProps = {
	showSettings?: boolean;
};

export const MainHeader: React.FC<MainHeaderProps> = ({
	showSettings = true,
}) => {
	function openSettings() {
		if (typeof window !== "undefined") {
			window.dispatchEvent(new Event("pomodoro:openSettings"));
		}
	}

	const { isPro, isAuthenticated, loading } = useAuth();
	const [isStatsOpen, setIsStatsOpen] = useState(false);
	const { isDark, toggleTheme } = useTheme();
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const closeMenu = () => setIsMenuOpen(false);

	return (
		<>
			<header className="w-full border-b border-soft bg-background backdrop-blur-md">
				<div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3 gap-3">
					{/* Branding (leva para a home) */}
					<Link
						href="/"
						className="flex flex-col hover:opacity-90 transition-opacity"
						onClick={closeMenu}
					>
						<h1 className="text-lg font-semibold tracking-tight text-primary">
							Pomodoro Focus
						</h1>
						<p className="text-xs text-muted">
							• {isPro ? "Plano Pro" : "Plano Free"}
						</p>
					</Link>

					{/* Ações */}
					<div className="flex items-center gap-2">
						{/* Desktop / tablet */}
						<div className="hidden sm:flex items-center gap-2">
							{/* Estatísticas – somente Pro */}
							{isPro && (
								<button
									type="button"
									onClick={() => setIsStatsOpen(true)}
									className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:border-emerald-500 hover:text-secondary hover:bg-soft transition-colors cursor-pointer inline-flex items-center gap-1.5"
								>
									<BarChart3 className="h-4 w-4" aria-hidden />
									Estatísticas
								</button>
							)}

							{/* CTA de plano Pro / gerenciamento */}
							{!loading && (
								<>
									{isAuthenticated && isPro && (
										<Link
											href="/pro/manage"
											className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:border-emerald-500 hover:text-secondary hover:bg-soft transition-colors cursor-pointer inline-flex items-center gap-1.5"
										>
											<Crown className="h-4 w-4" aria-hidden />
											Gerenciar plano
										</Link>
									)}

									{(!isAuthenticated || !isPro) && (
										<Link
											href="/pro"
											className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:border-emerald-500 hover:text-secondary hover:bg-soft transition-colors cursor-pointer inline-flex items-center gap-1.5"
										>
											<Sparkles className="h-4 w-4" aria-hidden />
											Seja Pro
										</Link>
									)}
								</>
							)}

							{/* Configurações */}
							{showSettings && (
								<button
									type="button"
									onClick={openSettings}
									className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:border-emerald-500 hover:text-secondary hover:bg-soft transition-colors cursor-pointer inline-flex items-center gap-1.5"
								>
									<Settings className="h-4 w-4" aria-hidden />
									Configurações
								</button>
							)}

							{/* Toggle de tema */}
							<button
								type="button"
								onClick={toggleTheme}
								className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:border-emerald-500 hover:text-secondary hover:bg-soft transition-colors cursor-pointer inline-flex items-center gap-1.5"
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

						{/* Mobile */}
						<div className="flex sm:hidden items-center gap-1.5">
							{/* Tema - ícone somente */}
							<button
								type="button"
								onClick={toggleTheme}
								className="p-1.5 rounded-full border border-soft text-secondary hover:bg-soft transition-colors inline-flex items-center justify-center"
							>
								{isDark ? (
									<Sun className="h-4 w-4" aria-hidden />
								) : (
									<Moon className="h-4 w-4" aria-hidden />
								)}
								<span className="sr-only">
									{isDark ? "Ativar tema claro" : "Ativar tema escuro"}
								</span>
							</button>

							{/* Botão de menu */}
							<button
								type="button"
								onClick={() => setIsMenuOpen((prev) => !prev)}
								className="p-1.5 rounded-full border border-soft text-secondary hover:bg-soft transition-colors inline-flex items-center justify-center"
								aria-label="Abrir menu"
							>
								{isMenuOpen ? (
									<X className="h-4 w-4" aria-hidden />
								) : (
									<Menu className="h-4 w-4" aria-hidden />
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Menu mobile */}
				{isMenuOpen && (
					<div className="sm:hidden border-t border-soft bg-background">
						<div className="max-w-4xl mx-auto px-4 py-3 space-y-3">
							<Link
								href="/"
								onClick={closeMenu}
								className="flex items-center gap-2 text-sm text-secondary hover:bg-soft px-3 py-2 rounded-lg"
							>
								<Home className="h-4 w-4" aria-hidden />
								Início
							</Link>

							{isPro && (
								<button
									type="button"
									onClick={() => {
										setIsStatsOpen(true);
										closeMenu();
									}}
									className="w-full text-left text-sm px-3 py-2 rounded-lg border border-soft text-secondary hover:bg-soft inline-flex items-center gap-2"
								>
									<BarChart3 className="h-4 w-4" aria-hidden />
									Estatísticas
								</button>
							)}

							{!loading && (
								<>
									{isAuthenticated && isPro && (
										<Link
											href="/pro/manage"
											onClick={closeMenu}
											className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-soft text-secondary hover:bg-soft"
										>
											<Crown className="h-4 w-4" aria-hidden />
											Gerenciar plano
										</Link>
									)}

									{(!isAuthenticated || !isPro) && (
										<Link
											href="/pro"
											onClick={closeMenu}
											className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-soft text-secondary hover:bg-soft"
										>
											<Sparkles className="h-4 w-4" aria-hidden />
											Seja Pro
										</Link>
									)}
								</>
							)}

							{showSettings && (
								<button
									type="button"
									onClick={() => {
										openSettings();
										closeMenu();
									}}
									className="w-full text-left text-sm px-3 py-2 rounded-lg border border-soft text-secondary hover:bg-soft inline-flex items-center gap-2"
								>
									<Settings className="h-4 w-4" aria-hidden />
									Configurações
								</button>
							)}

							<div className="pt-2 border-t border-soft">
								<SocialLoginButtons />
							</div>
						</div>
					</div>
				)}
			</header>

			{/* Modal de estatísticas */}
			<StatsOverviewModal
				open={isStatsOpen}
				onClose={() => setIsStatsOpen(false)}
			/>
		</>
	);
};
