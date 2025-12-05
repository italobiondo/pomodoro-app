import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { StatsOverviewResponse } from './dto/stats-response.dto';
import { StatsService } from './stats.service';
import { StartFocusSessionDto } from './dto/start-focus-session.dto';
import { FinishFocusSessionDto } from './dto/finish-focus-session.dto';
import { FocusSessionResponseDto } from './dto/focus-session-response.dto';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  async getOverview(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StatsOverviewResponse> {
    return this.statsService.getOverview(user.id);
  }
  @Post('focus-sessions/start')
  async startFocusSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: StartFocusSessionDto,
  ): Promise<FocusSessionResponseDto> {
    const session = await this.statsService.startFocusSession(user.id, body);

    return {
      id: session.id,
      startedAt: session.startedAt,
      endedAt: session.endedAt ?? null,
      focusMinutes: session.focusMinutes,
      breakMinutes: session.breakMinutes,
    };
  }

  @Post('focus-sessions/:id/finish')
  async finishFocusSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') sessionId: string,
    @Body() body: FinishFocusSessionDto,
  ): Promise<FocusSessionResponseDto> {
    const session = await this.statsService.finishFocusSession(
      user.id,
      sessionId,
      body,
    );

    return {
      id: session.id,
      startedAt: session.startedAt,
      endedAt: session.endedAt ?? null,
      focusMinutes: session.focusMinutes,
      breakMinutes: session.breakMinutes,
    };
  }
}
