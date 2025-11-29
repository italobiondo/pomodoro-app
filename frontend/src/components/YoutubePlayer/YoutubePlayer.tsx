"use client";

import React, { useEffect, useMemo, useState } from "react";

const YOUTUBE_STORAGE_KEY = "pomodoro:lastYoutubeUrl";

function extractVideoId(url: string): string | null {
	try {
		const u = new URL(url);

		// Formato encurtado: https://youtu.be/VIDEOID
		if (u.hostname.includes("youtu.be")) {
			const parts = u.pathname.split("/").filter(Boolean);
			return parts[0] ?? null;
		}

		// Formatos comuns do youtube.com
		if (u.hostname.includes("youtube.com")) {
			// https://www.youtube.com/watch?v=VIDEOID
			if (u.pathname === "/watch") {
				return u.searchParams.get("v");
			}

			// https://www.youtube.com/embed/VIDEOID
			if (u.pathname.startsWith("/embed/")) {
				const parts = u.pathname.split("/").filter(Boolean);
				return parts[1] ?? null;
			}

			// https://www.youtube.com/shorts/VIDEOID
			if (u.pathname.startsWith("/shorts/")) {
				const parts = u.pathname.split("/").filter(Boolean);
				return parts[1] ?? null;
			}
		}

		return null;
	} catch {
		return null;
	}
}

export const YoutubePlayer: React.FC = () => {
	// Lê do localStorage na inicialização (sem useEffect)
	const [inputUrl, setInputUrl] = useState<string>(() => {
		if (typeof window === "undefined") return "";
		const stored = window.localStorage.getItem(YOUTUBE_STORAGE_KEY);
		return stored ?? "";
	});

	const [currentUrl, setCurrentUrl] = useState<string | null>(() => {
		if (typeof window === "undefined") return null;
		const stored = window.localStorage.getItem(YOUTUBE_STORAGE_KEY);
		return stored || null;
	});

	const [error, setError] = useState<string | null>(null);
	const [loop, setLoop] = useState(false);

	// Persiste sempre que o link atual muda
	useEffect(() => {
		if (typeof window === "undefined") return;

		if (!currentUrl) {
			window.localStorage.removeItem(YOUTUBE_STORAGE_KEY);
			return;
		}

		window.localStorage.setItem(YOUTUBE_STORAGE_KEY, currentUrl);
	}, [currentUrl]);

	const videoId = useMemo(() => {
		if (!currentUrl) return null;
		return extractVideoId(currentUrl);
	}, [currentUrl]);

	const embedUrl = useMemo(() => {
		if (!videoId) return null;

		const params = new URLSearchParams({
			rel: "0",
			modestbranding: "1",
			controls: "1",
		});

		// Loop usando parâmetros oficiais do YouTube
		if (loop) {
			params.set("loop", "1");
			params.set("playlist", videoId);
		}

		return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
	}, [videoId, loop]);

	function handleLoad(e?: React.FormEvent) {
		if (e) e.preventDefault();

		const trimmed = inputUrl.trim();
		const id = extractVideoId(trimmed);

		if (!id) {
			setError("Insira um link válido do YouTube.");
			return;
		}

		setError(null);
		setCurrentUrl(trimmed);
	}

	return (
		<section className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
			<header className="flex items-center justify-between mb-2">
				<div>
					<h2 className="text-sm font-semibold text-slate-100">
						Player de YouTube
					</h2>
					<p className="text-xs text-slate-400">
						Conecte lo-fi, white noise ou sua playlist favorita.
					</p>
				</div>
				{/* Badge simples só pra reforçar que está ativo */}
				<span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300 border border-emerald-700/60">
					Ativo
				</span>
			</header>

			<form onSubmit={handleLoad} className="space-y-3 text-xs text-slate-400">
				<div className="flex gap-2">
					<input
						type="url"
						placeholder="Cole aqui o link do vídeo ou playlist..."
						value={inputUrl}
						onChange={(e) => setInputUrl(e.target.value)}
						className="flex-1 rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
					/>
					<button
						type="submit"
						className="px-3 py-1.5 rounded-lg bg-emerald-600 text-[11px] text-white border border-emerald-500 hover:bg-emerald-500 transition-colors"
					>
						Usar
					</button>
				</div>

				{error && <p className="text-[11px] text-red-400">{error}</p>}

				<div className="flex items-center gap-3">
					<label className="flex items-center gap-1 text-xs cursor-pointer select-none">
						<input
							type="checkbox"
							checked={loop}
							onChange={(e) => setLoop(e.target.checked)}
							className="h-3 w-3 rounded border-slate-600 bg-slate-900"
						/>
						<span className="text-slate-300 text-[11px]">Loop</span>
					</label>

					<p className="text-[11px] text-slate-500">
						Play/pause, volume e mudo ficam nos controles do próprio player.
					</p>
				</div>

				<div className="mt-2 aspect-video w-full rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
					{embedUrl ? (
						<iframe
							className="w-full h-full"
							src={embedUrl}
							title="Player de foco do YouTube"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
						/>
					) : (
						<span className="text-[11px] text-slate-500 px-4 text-center">
							Cole um link de música, lo-fi ou som ambiente do YouTube para
							acompanhar seus ciclos de foco.
						</span>
					)}
				</div>

				<p className="text-[11px] text-slate-500">
					O player é totalmente integrado ao YouTube, sem anúncios extras além
					do próprio YouTube.
				</p>
			</form>
		</section>
	);
};
