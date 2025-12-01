import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TimerSettings } from './entities/timer-settings.entity';
import { UpdateTimerSettingsDto } from './dto/update-timer-settings.dto';
import { User } from '../users/user.entity';

// Tipagem dos campos que realmente são configuráveis
type TimerConfigFields = {
  pomodoroDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStart: boolean;
};

const DEFAULT_SETTINGS: TimerConfigFields = {
  pomodoroDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStart: false,
};

@Injectable()
export class TimerService {
  constructor(
    @InjectRepository(TimerSettings)
    private readonly timerSettingsRepo: Repository<TimerSettings>,
  ) {}

  private async findOrCreateByUser(user: User): Promise<TimerSettings> {
    let settings = await this.timerSettingsRepo.findOne({
      where: { userId: user.id },
    });

    if (!settings) {
      settings = this.timerSettingsRepo.create({
        userId: user.id,
        ...DEFAULT_SETTINGS,
      });

      settings = await this.timerSettingsRepo.save(settings);
    }

    return settings;
  }

  async getSettingsForUser(user: User): Promise<TimerSettings> {
    return this.findOrCreateByUser(user);
  }

  async updateSettingsForUser(
    user: User,
    dto: UpdateTimerSettingsDto,
  ): Promise<TimerSettings> {
    // Regra simples de Pro por enquanto
    if (user.plan !== 'pro') {
      throw new ForbiddenException(
        'Timer settings are available only for Pro users',
      );
    }

    const settings = await this.findOrCreateByUser(user);

    Object.assign(settings, dto);

    return this.timerSettingsRepo.save(settings);
  }
}
