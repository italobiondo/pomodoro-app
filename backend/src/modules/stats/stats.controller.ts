import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

import { StatsService } from './stats.service';
import { StartFocusSessionDto } from './dto/start-focus-session.dto';
import { FinishFocusSessionDto } from './dto/finish-focus-session.dto';
import { CreateFocusSessionEventDto } from './dto/create-focus-session-event.dto';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getOverview(@CurrentUser() user: AuthenticatedUser) {
    return await this.statsService.getOverview(user.id);
  }

  @Throttle({ default: { limit: 60, ttl: 60 } })
  @Post('focus-sessions/start')
  async startFocusSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartFocusSessionDto,
  ) {
    return await this.statsService.startFocusSession(user.id, dto);
  }

  @Throttle({ default: { limit: 60, ttl: 60 } })
  @Post('focus-sessions/:id/finish')
  async finishFocusSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() dto: FinishFocusSessionDto,
  ) {
    return await this.statsService.finishFocusSession(user.id, sessionId, dto);
  }

  @Throttle({ default: { limit: 120, ttl: 60 } })
  @Post('focus-sessions/:id/events')
  async addFocusSessionEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) sessionId: string,
    @Body() dto: CreateFocusSessionEventDto,
  ): Promise<{ ok: true }> {
    await this.statsService.addFocusSessionEvent(user.id, sessionId, dto);
    return { ok: true };
  }
}
