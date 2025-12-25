import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

import { TimerStateService } from './timer-state.service';
import { UpsertTimerStateDto } from './dto/upsert-timer-state.dto';

@Controller('timer-state')
@UseGuards(JwtAuthGuard)
export class TimerStateController {
  constructor(private readonly timerStateService: TimerStateService) {}

  @Throttle({ default: { limit: 120, ttl: 60 } })
  @Get()
  async get(@CurrentUser() user: AuthenticatedUser) {
    return await this.timerStateService.getTimerState(user.id);
  }

  @Throttle({ default: { limit: 120, ttl: 60 } })
  @Put()
  async upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertTimerStateDto,
  ) {
    return await this.timerStateService.upsertTimerState(user.id, dto);
  }
}
