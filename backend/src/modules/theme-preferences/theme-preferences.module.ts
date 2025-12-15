import { Module } from '@nestjs/common';
import { ThemePreferencesController } from './theme-preferences.controller';
import { ThemePreferencesService } from './theme-preferences.service';

@Module({
  controllers: [ThemePreferencesController],
  providers: [ThemePreferencesService],
  exports: [ThemePreferencesService],
})
export class ThemePreferencesModule {}
