import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { TimerSettingsService } from './timer-settings.service';
import { UpdateTimerSettingsDto } from './dto/update-timer-settings.dto';

@Controller('timer-settings')
@UseGuards(JwtAuthGuard)
export class TimerSettingsController {
  constructor(private readonly timerSettingsService: TimerSettingsService) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.timerSettingsService.getMySettings(user.id);
  }

  @Put('me')
  async putMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateTimerSettingsDto,
  ) {
    return this.timerSettingsService.upsertMySettings(user.id, body);
  }
}
