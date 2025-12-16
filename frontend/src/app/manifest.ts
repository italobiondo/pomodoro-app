import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "PomodoroPlus",
		short_name: "PomodoroPlus",
		description:
			"Timer Pomodoro com tarefas, player de YouTube e estatísticas de foco.",
		lang: "pt-BR",
		start_url: "/",
		scope: "/",
		display: "standalone",
		background_color: "#0B0F14",
		theme_color: "#0B0F14",
		icons: [
			{
				src: "/icon-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icon-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable",
			},
			{
				src: "/icon-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icon-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
}
