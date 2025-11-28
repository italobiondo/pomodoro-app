// frontend/src/app/layout.tsx
import type { ReactNode } from "react";
import "../styles/globals.css";

export const metadata = {
	title: "Pomodoro Focus",
	description: "Timer Pomodoro com YouTube, Free e Pro",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="pt-BR">
			<body className="min-h-screen bg-background text-foreground">
				<div className="min-h-screen flex flex-col">
					<header className="w-full border-b px-4 py-3 flex items-center justify-between">
						<span className="font-semibold">Pomodoro Focus</span>
						<div className="flex items-center gap-3">
							{/* Botão Criar Conta Pro / Login Pro (placeholder) */}
							<button className="text-sm underline">Criar Conta Pro</button>
						</div>
					</header>

					<main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
						{children}
					</main>

					<footer className="w-full border-t px-4 py-3 text-xs text-center">
						{/* Espaço para anúncios leves (Free) */}
						<span>Anúncio leve aqui (Free)</span>
					</footer>
				</div>
			</body>
		</html>
	);
}
