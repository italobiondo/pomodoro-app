import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateTimerSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  pomodoroDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  shortBreakDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  longBreakDuration?: number;

  @IsOptional()
  @IsBoolean()
  autoStart?: boolean;
}
