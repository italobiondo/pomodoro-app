import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimerSettings } from './entities/timer-settings.entity';
import { TimerService } from './timer.service';
import { TimerController } from './timer.controller';
import { UsersModule } from '../users/users.module'; // se você precisar injetar UserService em algum momento

@Module({
  imports: [TypeOrmModule.forFeature([TimerSettings]), UsersModule],
  controllers: [TimerController],
  providers: [TimerService],
  exports: [TimerService],
})
export class TimerModule {}
