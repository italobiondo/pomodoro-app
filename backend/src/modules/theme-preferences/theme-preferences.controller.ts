import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

import { ThemePreferencesService } from './theme-preferences.service';
import { UpdateThemePreferenceDto } from './dto/update-theme-preference.dto';

@UseGuards(JwtAuthGuard)
@Controller('theme-preferences')
export class ThemePreferencesController {
  constructor(private readonly service: ThemePreferencesService) {}

  @Throttle({ default: { limit: 60, ttl: 60 } })
  @Get('me')
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return await this.service.getMyPreference(user.id);
  }

  @Throttle({ default: { limit: 30, ttl: 60 } })
  @Put('me')
  async putMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateThemePreferenceDto,
  ) {
    return await this.service.upsertMyPreference(user.id, dto);
  }
}
