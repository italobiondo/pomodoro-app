import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { UsersService } from '../../users/users.service';
import { AuthenticatedUser } from '../auth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly usersService: UsersService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: unknown,
    done: (error: unknown, user?: AuthenticatedUser) => void,
  ): Promise<void> {
    try {
      // O objeto `profile` vem de uma lib externa e é tipado de forma frouxa,
      // então fazemos o cast controlado e silenciamos o ESLint aqui.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const typedProfile = profile as Profile;

      // Extraímos o e-mail com bastante cuidado e checagens.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const emails = (typedProfile as any).emails as
        | Array<{ value?: string }>
        | undefined;

      const primaryEmail =
        Array.isArray(emails) && typeof emails[0]?.value === 'string'
          ? emails[0].value
          : undefined;

      if (!primaryEmail) {
        return done(new Error('No email from Google'), undefined);
      }

      // Provider ID e nome também vêm da lib externa, então fazemos acesso via `any`
      // com comentários de ESLint apenas nessas linhas.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const providerIdRaw = (typedProfile as any).id;
      const providerId = String(providerIdRaw);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const nameRaw = (typedProfile as any).displayName;
      const name = typeof nameRaw === 'string' ? nameRaw : undefined;

      const user = await this.usersService.findOrCreateSocialUser({
        provider: 'google',
        providerId,
        email: primaryEmail,
        name,
      });

      const authUser: AuthenticatedUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt ?? undefined,
      };

      return done(null, authUser);
    } catch (err) {
      return done(err, undefined);
    }
  }
}
