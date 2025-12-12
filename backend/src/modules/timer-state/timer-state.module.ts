import { Module } from '@nestjs/common';
import { TimerStateController } from './timer-state.controller';
import { TimerStateService } from './timer-state.service';

@Module({
  controllers: [TimerStateController],
  providers: [TimerStateService],
})
export class TimerStateModule {}
