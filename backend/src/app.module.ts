import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    // Config/global
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    HealthModule,
    UsersModule,

    AuthModule,
  ],
})
export class AppModule {}
