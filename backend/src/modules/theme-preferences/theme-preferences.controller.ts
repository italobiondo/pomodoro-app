import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { ThemePreferencesService } from './theme-preferences.service';
import { UpdateThemePreferenceDto } from './dto/update-theme-preference.dto';

@UseGuards(JwtAuthGuard)
@Controller('theme-preferences')
export class ThemePreferencesController {
  constructor(private readonly service: ThemePreferencesService) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthenticatedUser | null) {
    // Se o JwtAuthGuard estiver ok, user não deve ser null, mas mantemos seguro.
    const userId = user?.id;
    if (!userId) return { themeKey: null };

    return this.service.getMyPreference(userId);
  }

  @Put('me')
  async putMe(
    @CurrentUser() user: AuthenticatedUser | null,
    @Body() dto: UpdateThemePreferenceDto,
  ) {
    const userId = user?.id;
    if (!userId) return { themeKey: null };

    return this.service.upsertMyPreference(userId, dto);
  }
}
