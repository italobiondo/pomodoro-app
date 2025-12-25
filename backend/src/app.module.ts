import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';

import { PrismaModule } from './infra/database/prisma/prisma.module';
import { UserThrottlerGuard } from './infra/security/user-throttler.guard';

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

    // Rate limit global (Redis) — endpoints críticos terão override com @Throttle nos controllers.
    ThrottlerModule.forRootAsync({
      useFactory: () => {
        const ttl = Number(process.env.THROTTLE_TTL ?? 60); // segundos
        const limit = Number(process.env.THROTTLE_LIMIT ?? 120); // req por ttl
        const redisUrl = process.env.REDIS_URL ?? 'redis://redis:6379';

        const redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
        });

        redis.on('error', (err) => {
          // Log estruturado, sem derrubar a aplicação
          console.error('[Redis]', err.message);
        });

        return {
          throttlers: [
            {
              name: 'default',
              ttl,
              limit,
            },
          ],
          storage: new ThrottlerStorageRedisService(redis),
        };
      },
    }),

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
    // Throttling global (tracker por userId quando autenticado)
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard,
    },
  ],
})
export class AppModule {}
