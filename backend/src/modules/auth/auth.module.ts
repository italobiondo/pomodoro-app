import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

const DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60; // 7 dias

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ session: false }),

    // Mesmo sendo global, deixamos explícito aqui porque JwtModule.registerAsync usa imports/inject.
    ConfigModule,

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_ACCESS_TOKEN_SECRET');

        if (!secret) {
          // Falha explícita e imediata (melhor do que quebrar só no callback do Google)
          throw new Error(
            'JWT_ACCESS_TOKEN_SECRET não está definido. Verifique seu backend/.env (modo local) ou infra/env/.env.dev (modo docker).',
          );
        }

        const rawExpires = config.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN');
        const parsed = rawExpires ? Number(rawExpires) : NaN;

        const expiresIn =
          !Number.isNaN(parsed) && parsed > 0
            ? parsed
            : DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS;

        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
