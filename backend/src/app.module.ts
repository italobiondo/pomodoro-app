import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TodosModule } from './modules/todos/todos.module';
import { PrismaModule } from './infra/database/prisma/prisma.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { StatsModule } from './modules/stats/stats.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PlansModule } from './modules/plans/plans.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    UsersModule,
    AuthModule,
    TodosModule,
    PrismaModule,
    TasksModule,
    StatsModule,
    SubscriptionsModule,
    PaymentsModule,
    PlansModule,
  ],
})
export class AppModule {}
