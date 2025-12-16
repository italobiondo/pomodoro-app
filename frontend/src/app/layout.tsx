import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "../hooks/useAuth";

export const metadata: Metadata = {
	title: {
		default: "PomodoroPlus – Timer, tarefas e foco profundo",
		template: "%s | PomodoroPlus",
	},
	description:
		"PomodoroPlus é um timer Pomodoro com lista de tarefas, player de YouTube e estatísticas de foco para melhorar sua produtividade.",
	metadataBase: process.env.NEXT_PUBLIC_SITE_URL
		? new URL(process.env.NEXT_PUBLIC_SITE_URL)
		: undefined,
	alternates: {
		canonical: "/",
	},
	icons: {
		icon: [
			{ url: "/favicon.ico" },
			{ url: "/icon-192.png", type: "image/png", sizes: "192x192" },
			{ url: "/icon-512.png", type: "image/png", sizes: "512x512" },
		],
		apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
	},
	openGraph: {
		title: "PomodoroPlus – Timer, tarefas e foco profundo",
		description:
			"Aumente sua produtividade com um timer Pomodoro integrado a tarefas, player de YouTube e estatísticas de foco.",
		url: "/",
		siteName: "PomodoroPlus",
		locale: "pt_BR",
		type: "website",
		images: [
			{
				url: "/og-image.png",
				width: 1200,
				height: 630,
				alt: "PomodoroPlus",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "PomodoroPlus – Timer, tarefas e foco profundo",
		description:
			"Aumente sua produtividade com um timer Pomodoro integrado a tarefas, player de YouTube e estatísticas de foco.",
		images: ["/og-image.png"],
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="pt-BR">
			<body className="min-h-screen antialiased">
				{/* Script global do Google AdSense */}
				<Script
					id="adsbygoogle-init"
					strategy="afterInteractive"
					src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
					crossOrigin="anonymous"
				/>

				<AuthProvider>{children}</AuthProvider>
			</body>
		</html>
	);
}
