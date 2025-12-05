// Por enquanto deixamos bem simples.
// Esses campos permitem evoluir depois (ex: guardar planejado).
export class StartFocusSessionDto {
  // Duração planejada do pomodoro em minutos (ex: 25)
  plannedFocusMinutes?: number;

  // Duração planejada do break logo após em minutos (ex: 5 ou 15)
  plannedBreakMinutes?: number;

  // ID opcional gerado no front para correlacionar (para futuros usos)
  clientSessionId?: string;
}
