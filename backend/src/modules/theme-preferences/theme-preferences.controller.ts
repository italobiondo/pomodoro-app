import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ThemePreferencesService } from './theme-preferences.service';
import { UpdateThemePreferenceDto } from './dto/update-theme-preference.dto';

@Controller('theme-preferences')
@UseGuards(JwtAuthGuard)
export class ThemePreferencesController {
  constructor(
    private readonly themePreferencesService: ThemePreferencesService,
  ) {}

  @Throttle({ default: { limit: 60, ttl: 60 } })
  @Get('me')
  async getMyThemePreference(@CurrentUser() user: AuthenticatedUser) {
    return await this.themePreferencesService.getMyThemePreference(user.id);
  }

  @Throttle({ default: { limit: 30, ttl: 60 } })
  @Put('me')
  async updateMyThemePreference(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateThemePreferenceDto,
  ) {
    return await this.themePreferencesService.updateMyThemePreference(
      user.id,
      dto,
    );
  }
}
