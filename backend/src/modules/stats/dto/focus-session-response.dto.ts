export class FocusSessionResponseDto {
  id!: string;
  startedAt!: Date;
  endedAt?: Date | null;

  focusMinutes!: number;
  breakMinutes!: number;
}
