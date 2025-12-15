import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import { UpdateThemePreferenceDto } from './dto/update-theme-preference.dto';

@Injectable()
export class ThemePreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureUserIsPro(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) throw new NotFoundException('User not found.');
    if (user.plan !== 'PRO') {
      throw new ForbiddenException(
        'Temas premium estão disponíveis apenas para usuários Pro.',
      );
    }
  }

  async getMyPreference(userId: string): Promise<{ themeKey: string | null }> {
    await this.ensureUserIsPro(userId);

    const pref = await this.prisma.themePreference.findUnique({
      where: { userId },
      select: { themeKey: true },
    });

    return { themeKey: pref?.themeKey ?? null };
  }

  async upsertMyPreference(userId: string, dto: UpdateThemePreferenceDto) {
    await this.ensureUserIsPro(userId);

    const saved = await this.prisma.themePreference.upsert({
      where: { userId },
      create: { userId, themeKey: dto.themeKey },
      update: { themeKey: dto.themeKey },
      select: { themeKey: true, updatedAt: true },
    });

    return saved;
  }
}
