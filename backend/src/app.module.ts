import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './infra/database/prisma/prisma.module';

import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PlansModule } from './modules/plans/plans.module';
import { StatsModule } from './modules/stats/stats.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ThemePreferencesModule } from './modules/theme-preferences/theme-preferences.module';
import { TimerSettingsModule } from './modules/timer-settings/timer-settings.module';
import { TimerStateModule } from './modules/timer-state/timer-state.module';
import { TodosModule } from './modules/todos/todos.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limit global: depois vamos “apertar” auth/payments com override por rota.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: Number(process.env.THROTTLE_TTL ?? 60), // segundos
        limit: Number(process.env.THROTTLE_LIMIT ?? 120), // requests por ttl
      },
    ]),

    PrismaModule,

    HealthModule,
    UsersModule,
    AuthModule,
    TodosModule,
    TasksModule,
    StatsModule,
    SubscriptionsModule,
    PaymentsModule,
    PlansModule,
    TimerStateModule,
    TimerSettingsModule,
    ThemePreferencesModule,
  ],
  providers: [
    // Throttling global
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
