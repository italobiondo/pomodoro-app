/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Tracker do rate limit:
 * - autenticado: userId
 * - anônimo: IP
 *
 * Observação: na sua versão do ThrottlerGuard, getTracker precisa retornar Promise<string>.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(
    req: Record<string, unknown>,
  ): Promise<string> {
    const r = req as Partial<{
      user: unknown;
      headers: Record<string, unknown>;
      ip: unknown;
      socket: { remoteAddress?: unknown };
    }>;

    const user = r.user as { id?: unknown } | undefined;
    const userId = user?.id;

    if (typeof userId === 'string' && userId.length > 0) return userId;

    const headers = r.headers ?? {};
    const xff = headers['x-forwarded-for'];
    const ipFromXff =
      typeof xff === 'string' ? xff.split(',')[0]?.trim() : undefined;

    const ip =
      ipFromXff ||
      (typeof r.ip === 'string' ? r.ip : undefined) ||
      (typeof r.socket?.remoteAddress === 'string'
        ? r.socket.remoteAddress
        : undefined);

    return typeof ip === 'string' && ip.length > 0 ? ip : 'unknown';
  }
}
