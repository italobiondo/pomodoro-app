import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { AuthenticatedUser } from '../auth.types';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    const jwtFromRequest = ExtractJwt.fromExtractors([
      (req: Request | null): string | null => {
        if (!req || !req.cookies) {
          return null;
        }

        const cookies = req.cookies as Record<string, unknown>;
        const token = cookies['access_token'];

        return typeof token === 'string' ? token : null;
      },
    ]) as (req: Request) => string | null;

    super({
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET as string,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      // Passport converte isso em 401
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt ?? undefined,
    };
  }
}
