export class FinishFocusSessionDto {
  /**
   * Minutos reais de foco. Se não vier, vamos calcular com base em startedAt → now().
   */
  focusMinutes?: number;

  /**
   * Minutos reais de break associados a esta sessão.
   * Se não vier, vamos assumir 0 por enquanto.
   */
  breakMinutes?: number;

  /**
   * Opcionalmente, o front pode mandar o horário exato de término,
   * caso tenha algum ajuste local de timing.
   */
  endedAt?: Date;
}
