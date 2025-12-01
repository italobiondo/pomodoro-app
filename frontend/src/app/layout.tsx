import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "../hooks/useAuth";

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
			<body className="...">
				<AuthProvider>{children}</AuthProvider>
			</body>
		</html>
	);
}
