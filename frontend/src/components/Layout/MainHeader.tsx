"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
	ChevronDown,
	Lock,
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
	const {
		themeKey,
		isDark,
		toggleTheme,
		setThemeKey,
		allowedThemes,
		getThemeByKey,
	} = useTheme();

	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
	const themeMenuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		function onDocMouseDown(e: MouseEvent) {
			if (!isThemeMenuOpen) return;
			const el = themeMenuRef.current;
			if (!el) return;

			if (e.target instanceof Node && !el.contains(e.target)) {
				setIsThemeMenuOpen(false);
			}
		}

		document.addEventListener("mousedown", onDocMouseDown);
		return () => document.removeEventListener("mousedown", onDocMouseDown);
	}, [isThemeMenuOpen]);

	const closeMenu = () => setIsMenuOpen(false);

	return (
		<>
			<header className="w-full border-b border-soft bg-background backdrop-blur-md sticky top-0 z-100">
				<div className="max-w-6xl mx-auto flex flex-nowrap items-center justify-between px-4 py-3 gap-3">
					{/* Branding (leva para a home) */}
					<Link
						href="/"
						className="flex items-center gap-2 min-w-0 hover:opacity-90 transition-opacity"
						onClick={closeMenu}
					>
						<Image
							src="/icon-192.png"
							alt="PomodoroPlus"
							width={28}
							height={28}
							priority
							className="rounded-md"
						/>

						<div className="flex flex-col min-w-0">
							<h1 className="text-lg font-semibold tracking-tight text-primary whitespace-nowrap">
								PomodoroPlus
							</h1>

							<p className="text-xs text-muted whitespace-nowrap">
								• {isPro ? "Plano Pro" : "Plano Free"}
							</p>
						</div>
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
									className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:border-emerald-500 hover:text-secondary hover:bg-soft transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
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
											className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:border-emerald-500 hover:text-secondary hover:bg-soft transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
										>
											<Crown className="h-4 w-4" aria-hidden />
											Gerenciar plano
										</Link>
									)}

									{(!isAuthenticated || !isPro) && (
										<Link
											href="/pro"
											className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:border-emerald-500 hover:text-secondary hover:bg-soft transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
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
									className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:border-emerald-500 hover:text-secondary hover:bg-soft transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
								>
									<Settings className="h-4 w-4" aria-hidden />
									Configurações
								</button>
							)}

							{/* Seletor de tema (dropdown) */}
							<div className="relative" ref={themeMenuRef}>
								<button
									type="button"
									onClick={() => setIsThemeMenuOpen((v) => !v)}
									className="text-xs px-3 py-1.5 rounded-full border border-soft text-secondary hover:border-emerald-500 hover:text-secondary hover:bg-soft transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
									aria-haspopup="menu"
									aria-expanded={isThemeMenuOpen}
								>
									{themeKey === "light" ? (
										<Sun className="h-4 w-4" aria-hidden />
									) : themeKey === "dark" ? (
										<Moon className="h-4 w-4" aria-hidden />
									) : (
										<Sparkles className="h-4 w-4" aria-hidden />
									)}
									Tema: {getThemeByKey(themeKey).label}
									<ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
								</button>

								{isThemeMenuOpen && (
									<div
										role="menu"
										className="absolute right-0 mt-2 w-56 rounded-xl border border-overlay bg-overlay shadow-lg p-1 z-200"
									>
										{allowedThemes
											.filter((t) => t.key === "light" || t.key === "dark")
											.map((t) => {
												const Icon = t.icon;
												return (
													<button
														key={t.key}
														type="button"
														role="menuitem"
														onClick={() => {
															setThemeKey(t.key);
															setIsThemeMenuOpen(false);
														}}
														className="w-full text-left px-3 py-2 rounded-lg text-sm text-secondary hover:bg-soft inline-flex items-center gap-2"
													>
														<Icon className="h-4 w-4" aria-hidden />
														{t.label}
													</button>
												);
											})}

										<div className="my-1 border-t border-soft" />

										{/*
  Premium themes: sempre aparecer no menu, mas com gate.
  Como `allowedThemes` já filtra por plano, precisamos listar os premium do registry separadamente.
*/}
										{["midnight", "pomodoro-red"].map((key) => {
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											const theme = getThemeByKey(key as any);
											const Icon = theme.icon;
											const canUse = !theme.premium || isPro;

											return (
												<button
													key={theme.key}
													type="button"
													role="menuitem"
													onClick={() => {
														if (!canUse) {
															window.location.href = "/pro";
															return;
														}
														setThemeKey(theme.key);
														setIsThemeMenuOpen(false);
													}}
													className={[
														"w-full text-left px-3 py-2 rounded-lg text-sm inline-flex items-center justify-between gap-2",
														canUse
															? "text-secondary hover:bg-soft"
															: "text-muted hover:bg-soft",
													].join(" ")}
													title={
														canUse
															? "Tema premium ativável"
															: "Tema premium: disponível apenas no Plano Pro"
													}
												>
													<span className="inline-flex items-center gap-2">
														<Icon className="h-4 w-4" aria-hidden />
														{theme.label}
													</span>

													{canUse ? (
														<span className="text-[10px] px-2 py-0.5 rounded-full border border-soft text-muted">
															Premium
														</span>
													) : (
														<span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-soft text-muted">
															<Lock className="h-3 w-3" aria-hidden />
															Pro
														</span>
													)}
												</button>
											);
										})}
									</div>
								)}
							</div>

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
						<div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
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
