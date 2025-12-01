import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

const DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60; // 7 dias

const expiresIn =
  process.env.JWT_ACCESS_TOKEN_EXPIRES_IN &&
  !Number.isNaN(Number(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN))
    ? Number(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN)
    : DEFAULT_ACCESS_TOKEN_EXPIRES_IN_SECONDS;

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ session: false }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      signOptions: {
        expiresIn,
      },
    }),
  ],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
