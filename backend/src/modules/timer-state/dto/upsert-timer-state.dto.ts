import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  Min,
} from 'class-validator';

const MODES = ['pomodoro', 'short_break', 'long_break'] as const;

export class UpsertTimerStateDto {
  @IsIn(MODES)
  mode!: (typeof MODES)[number];

  @IsInt()
  @Min(0)
  remainingSeconds!: number;

  @IsBoolean()
  isRunning!: boolean;

  // timestamps vindos do front
  @IsOptional()
  @IsInt()
  @Min(0)
  lastUpdatedAt?: number | null;

  @IsInt()
  @Min(0)
  completedPomodoros!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lastFinishedAt?: number | null;

  // carimbo do cliente para conflito multi-dispositivo (recomendado)
  @IsOptional()
  @IsISO8601()
  clientUpdatedAt?: string;
}
