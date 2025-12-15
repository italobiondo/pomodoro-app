import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/database/prisma/prisma.module';
import { TimerSettingsController } from './timer-settings.controller';
import { TimerSettingsService } from './timer-settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [TimerSettingsController],
  providers: [TimerSettingsService],
})
export class TimerSettingsModule {}
