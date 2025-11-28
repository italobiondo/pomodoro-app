import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Pomodoro Focus",
	description: "Timer Pomodoro com YouTube e foco extremo",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="pt-BR">
			<body>{children}</body>
		</html>
	);
}
