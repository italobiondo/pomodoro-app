import { Clock3 } from "lucide-react";

export function PomodoroExplanation() {
	return (
		<section className="w-full max-w-4xl mx-auto mt-10 px-4 pb-10">
			<div className="card-main p-4 sm:p-6 space-y-3">
				<header className="flex items-start gap-2">
					<div className="mt-0.5">
						<Clock3 className="h-5 w-5 text-emerald-500" aria-hidden />
					</div>
					<div>
						<h2 className="text-lg sm:text-xl font-semibold text-secondary">
							Como funciona a técnica Pomodoro
						</h2>
						<p className="text-sm text-muted mt-1">
							Um método simples de gerenciamento de tempo: ciclos curtos de foco
							intenso intercalados com pausas rápidas, para manter energia e
							concentração ao longo do dia.
						</p>
					</div>
				</header>

				<ul className="text-sm text-secondary list-disc list-inside space-y-1">
					<li>25 minutos de foco total (um “Pomodoro”).</li>
					<li>5 minutos de pausa curta entre cada ciclo.</li>
					<li>Após 4 ciclos, uma pausa longa para recarregar.</li>
				</ul>

				<p className="text-xs text-muted">
					Use o timer acima para controlar seus ciclos e acompanhe seu ritmo de
					foco ao longo do tempo. Comece com o padrão e ajuste os tempos nas
					configurações conforme seu estilo de trabalho.
				</p>
			</div>
		</section>
	);
}
