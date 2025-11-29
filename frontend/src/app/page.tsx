import { TimerPanel } from "@/components/Timer/TimerPanel";
import { RightColumnFree } from "@/components/FreeLayout/RightColumnFree";
import { YoutubePlayer } from "@/components/YoutubePlayer/YoutubePlayer";

export default function HomePage() {
	return (
		<main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
			{/* Header */}
			<header className="w-full border-b border-slate-800">
				<div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
					<div className="flex flex-col">
						<h1 className="text-lg font-semibold tracking-tight">
							Pomodoro Focus
						</h1>
						<p className="text-xs text-slate-400">• Plano Free</p>
					</div>

					<button
						type="button"
						className="text-xs px-3 py-1.5 rounded-full border border-slate-600 hover:border-slate-300 hover:text-slate-50 transition-colors"
					>
						Criar Conta Pro
					</button>
				</div>
			</header>

			{/* Conteúdo principal */}
			<div className="w-full max-w-4xl mx-auto grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start pt-4">
				<div className="flex flex-col items-center gap-4 pb-4">
					<div className="w-full max-w-md">
						<TimerPanel />
					</div>

					<div className="w-full max-w-md">
						<YoutubePlayer />
					</div>
				</div>

				<RightColumnFree />
			</div>
		</main>
	);
}
