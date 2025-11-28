import { TimerPanel } from "@/components/Timer/TimerPanel";

export default function HomePage() {
	return (
		<main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
			{/* Header simples do Free */}
			<header className="w-full border-b border-slate-800">
				<div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
					<div className="flex flex-col">
						<h1 className="text-lg font-semibold tracking-tight">
							Pomodoro Focus
						</h1>
						<p className="text-xs text-slate-400">
							Timer de foco com YouTube • Plano Free
						</p>
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
			<div className="flex-1 flex flex-col items-center px-4 py-6">
				<div className="w-full max-w-4xl grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
					{/* Coluna esquerda: Timer */}
					<div className="flex items-center justify-center">
						<TimerPanel />
					</div>

					{/* Coluna direita: espaço reservado para futuro (To-do, player, etc.) */}
					<aside className="space-y-4">
						<div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-3 text-sm text-slate-400">
							<p className="font-medium text-slate-200 mb-1">Em breve:</p>
							<ul className="list-disc list-inside space-y-1 text-xs">
								<li>Lista de tarefas (To-do)</li>
								<li>Player de YouTube integrado</li>
								<li>Layout completo do painel Free</li>
							</ul>
						</div>

						{/* Slot de anúncio leve (Free) */}
						<div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-400">
							<p className="font-semibold text-slate-200 text-sm mb-1">
								Anúncio leve aqui (Free)
							</p>
							<p>
								Espaço reservado para um anúncio discreto, sem distrações. Nada
								de banners piscando ou pop-ups 😊
							</p>
						</div>
					</aside>
				</div>
			</div>
		</main>
	);
}
