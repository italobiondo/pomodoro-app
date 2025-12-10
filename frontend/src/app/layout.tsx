import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "../hooks/useAuth";

export const metadata: Metadata = {
	title: {
		default: "Pomodoro Focus – Timer, tarefas e foco profundo",
		template: "%s | Pomodoro Focus",
	},
	description:
		"Pomodoro Focus é um timer Pomodoro com lista de tarefas, player de YouTube e estatísticas de foco para melhorar sua produtividade.",
	metadataBase: process.env.NEXT_PUBLIC_SITE_URL
		? new URL(process.env.NEXT_PUBLIC_SITE_URL)
		: undefined,
	alternates: {
		canonical: "/",
	},
	openGraph: {
		title: "Pomodoro Focus – Timer, tarefas e foco profundo",
		description:
			"Aumente sua produtividade com um timer Pomodoro integrado a tarefas, player de YouTube e estatísticas de foco.",
		url: "/",
		siteName: "Pomodoro Focus",
		locale: "pt_BR",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Pomodoro Focus – Timer, tarefas e foco profundo",
		description:
			"Aumente sua produtividade com um timer Pomodoro integrado a tarefas, player de YouTube e estatísticas de foco.",
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
