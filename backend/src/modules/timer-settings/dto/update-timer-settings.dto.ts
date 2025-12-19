import { IsBoolean, IsInt, Max, Min } from 'class-validator';

export class UpdateTimerSettingsDto {
  @IsInt()
  @Min(1)
  @Max(120)
  pomodoroMinutes: number;

  @IsInt()
  @Min(1)
  @Max(60)
  shortBreakMinutes: number;

  @IsInt()
  @Min(1)
  @Max(60)
  longBreakMinutes: number;

  @IsBoolean()
  autoStartNext: boolean;
}
