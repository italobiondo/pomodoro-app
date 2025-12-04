import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { StatsOverviewResponse } from './dto/stats-response.dto';
import { StatsService } from './stats.service';

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
}
