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
	const [inputUrl, setInputUrl] = useState<string>("");
	const [currentUrl, setCurrentUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loop, setLoop] = useState(false);
	const [autoPlayTrigger, setAutoPlayTrigger] = useState(0);

	// Carrega do localStorage apenas no client (evita hydration mismatch)
	useEffect(() => {
		if (typeof window === "undefined") return;
		const stored = window.localStorage.getItem(YOUTUBE_STORAGE_KEY);
		if (stored) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setInputUrl(stored);
			setCurrentUrl(stored);
		}
	}, []);

	// Ouve o evento disparado pelo Timer para tentar dar autoplay
	useEffect(() => {
		if (typeof window === "undefined") return;

		const handler = () => {
			setAutoPlayTrigger((prev) => prev + 1);
		};

		window.addEventListener("pomodoro:focusPlayRequest", handler);
		return () => {
			window.removeEventListener("pomodoro:focusPlayRequest", handler);
		};
	}, []);

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

		if (loop) {
			params.set("loop", "1");
			params.set("playlist", videoId);
		}

		// Quando autoPlayTrigger > 0, tentamos dar autoplay no vídeo.
		// Também adicionamos um parâmetro "ap" pra garantir mudança de URL
		// e forçar o reload do iframe.
		if (autoPlayTrigger > 0) {
			params.set("autoplay", "1");
			params.set("ap", String(autoPlayTrigger));
		}

		return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
	}, [videoId, loop, autoPlayTrigger]);


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
		<section className="card-main px-4 py-3">
			<header className="flex items-center justify-between mb-2">
				<div>
					<h2 className="text-sm font-semibold text-secondary">
						Player de YouTube
					</h2>
					<p className="text-xs text-muted">
						Conecte lo-fi, white noise ou sua playlist favorita.
					</p>
				</div>
				<span className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide border border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-600">
					Ativo
				</span>
			</header>

			<form onSubmit={handleLoad} className="space-y-3 text-xs text-muted">
				<div className="flex gap-2">
					<input
						type="url"
						placeholder="Cole aqui o link do vídeo ou playlist..."
						value={inputUrl}
						onChange={(e) => setInputUrl(e.target.value)}
						className="flex-1 rounded-lg bg-soft border border-soft px-3 py-1.5 text-xs text-secondary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
					/>
					<button type="submit" className="px-3 py-1.5 rounded-lg btn-primary">
						Usar
					</button>
				</div>

				{error && <p className="text-[11px] text-red-500">{error}</p>}

				<div className="flex items-center gap-3">
					<label className="flex items-center gap-1 text-xs cursor-pointer select-none">
						<input
							type="checkbox"
							checked={loop}
							onChange={(e) => setLoop(e.target.checked)}
							className="h-3 w-3 rounded border-soft bg-background accent-emerald-500"
						/>
						<span className="text-secondary text-[11px]">Loop</span>
					</label>

					<p className="text-[11px] text-muted">
						Play/pause, volume e mudo ficam nos controles do próprio player.
					</p>
				</div>

				<div className="mt-2 aspect-video w-full rounded-lg bg-soft border border-soft overflow-hidden flex items-center justify-center">
					{embedUrl ? (
						<iframe
							className="w-full h-full"
							src={embedUrl}
							title="Player de foco do YouTube"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
						/>
					) : (
						<span className="text-[11px] text-muted px-4 text-center">
							Cole um link de música, lo-fi ou som ambiente do YouTube para
							acompanhar seus ciclos de foco.
						</span>
					)}
				</div>

				<p className="text-[11px] text-muted">
					O player é totalmente integrado ao YouTube, sem anúncios extras além
					do próprio YouTube.
				</p>
			</form>
		</section>
	);
};
