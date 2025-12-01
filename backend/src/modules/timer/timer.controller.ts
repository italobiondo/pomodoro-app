// backend/src/modules/timer/timer.controller.ts
import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { TimerService } from './timer.service';
import { UpdateTimerSettingsDto } from './dto/update-timer-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // ajuste caminho
import { CurrentUser } from '../auth/decorators/current-user.decorator'; // ajuste caminho
import { User } from '../users/user.entity'; // ajuste caminho

@Controller('timer')
@UseGuards(JwtAuthGuard)
export class TimerController {
  constructor(private readonly timerService: TimerService) {}

  @Get('settings')
  async getSettings(@CurrentUser() user: User) {
    const settings = await this.timerService.getSettingsForUser(user);

    return {
      pomodoroDuration: settings.pomodoroDuration,
      shortBreakDuration: settings.shortBreakDuration,
      longBreakDuration: settings.longBreakDuration,
      autoStart: settings.autoStart,
    };
  }

  @Put('settings')
  async updateSettings(
    @CurrentUser() user: User,
    @Body() dto: UpdateTimerSettingsDto,
  ) {
    const updated = await this.timerService.updateSettingsForUser(user, dto);

    return {
      pomodoroDuration: updated.pomodoroDuration,
      shortBreakDuration: updated.shortBreakDuration,
      longBreakDuration: updated.longBreakDuration,
      autoStart: updated.autoStart,
    };
  }
}
