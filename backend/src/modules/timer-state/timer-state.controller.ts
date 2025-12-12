import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { TimerStateService } from './timer-state.service';
import { UpsertTimerStateDto } from './dto/upsert-timer-state.dto';

@Controller('timer-state')
@UseGuards(JwtAuthGuard)
export class TimerStateController {
  constructor(private readonly timerStateService: TimerStateService) {}

  @Get()
  async get(@CurrentUser() user: AuthenticatedUser) {
    return this.timerStateService.getTimerState(user.id);
  }

  @Put()
  async upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpsertTimerStateDto,
  ) {
    return this.timerStateService.upsertTimerState(user.id, body);
  }
}
