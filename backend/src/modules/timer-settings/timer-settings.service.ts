/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { UpdateTimerSettingsDto } from './dto/update-timer-settings.dto';

type TimerSettingsResponse = {
  pomodoroMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  autoStartNext: boolean;
};

const DEFAULTS: TimerSettingsResponse = {
  pomodoroMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  autoStartNext: false,
};

function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  return Math.min(max, Math.max(min, i));
}

function toBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

@Injectable()
export class TimerSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureUserIsPro(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) throw new NotFoundException('User not found.');
    if (user.plan !== 'PRO') {
      throw new ForbiddenException(
        'Configurações de timer na nuvem estão disponíveis apenas para usuários Pro.',
      );
    }
  }

  async getMySettings(userId: string): Promise<TimerSettingsResponse> {
    await this.ensureUserIsPro(userId);

    const existing = await this.prisma.timerSettings.findUnique({
      where: { userId },
      select: {
        pomodoroMinutes: true,
        shortBreakMinutes: true,
        longBreakMinutes: true,
        autoStartNext: true,
      },
    });

    // Se não existir ainda, retorna defaults (sem criar automaticamente)
    // (criação pode ser feita no primeiro PUT)
    return existing ?? DEFAULTS;
  }

  async upsertMySettings(
    userId: string,
    dto: UpdateTimerSettingsDto,
  ): Promise<TimerSettingsResponse> {
    await this.ensureUserIsPro(userId);

    const data: TimerSettingsResponse = {
      pomodoroMinutes: clampInt(
        dto?.pomodoroMinutes,
        1,
        120,
        DEFAULTS.pomodoroMinutes,
      ),
      shortBreakMinutes: clampInt(
        dto?.shortBreakMinutes,
        1,
        60,
        DEFAULTS.shortBreakMinutes,
      ),
      longBreakMinutes: clampInt(
        dto?.longBreakMinutes,
        1,
        60,
        DEFAULTS.longBreakMinutes,
      ),
      autoStartNext: toBool(dto?.autoStartNext, DEFAULTS.autoStartNext),
    };

    const saved = await this.prisma.timerSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data },
      select: {
        pomodoroMinutes: true,
        shortBreakMinutes: true,
        longBreakMinutes: true,
        autoStartNext: true,
      },
    });

    return saved;
  }
}
