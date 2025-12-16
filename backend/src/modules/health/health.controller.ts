import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma/prisma.service';
import net from 'node:net';

async function tcpPing(url: string, timeoutMs = 600): Promise<boolean> {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const port = Number(parsed.port || 6379);

    return await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();

      const done = (ok: boolean) => {
        try {
          socket.destroy();
        } catch {
          // ignore
        }
        resolve(ok);
      };

      socket.setTimeout(timeoutMs);
      socket.once('error', () => done(false));
      socket.once('timeout', () => done(false));

      socket.connect(port, host, () => done(true));
    });
  } catch {
    return false;
  }
}

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async healthCheck() {
    const startedAt = Date.now();

    // DB
    let dbOk = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    // Redis (opcional)
    const redisUrl = process.env.REDIS_URL;
    const redisOk = redisUrl ? await tcpPing(redisUrl) : null;

    const ok = dbOk && (redisOk === null ? true : redisOk);

    return {
      status: ok ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      checks: {
        db: dbOk ? 'ok' : 'fail',
        redis: redisOk === null ? 'skipped' : redisOk ? 'ok' : 'fail',
      },
    };
  }
}
