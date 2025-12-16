import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

function parseCorsOrigins(): (string | RegExp)[] {
  // Permite múltiplas origens via:
  // FRONTEND_URL="http://localhost:3000,https://pomodoroplus.com.br"
  // FRONTEND_URL="*" (apenas dev; não recomendado em produção)
  const raw = (process.env.FRONTEND_URL || 'http://localhost:3000').trim();

  if (raw === '*') return ['*'];

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Headers de segurança
  app.use(
    helmet({
      // APIs normalmente não precisam de CSP; manter desabilitado evita bloqueios inesperados.
      contentSecurityPolicy: false,
      // Se você servir a API atrás de proxy com HTTPS, isso ajuda.
      // Ajuste conforme seu reverse proxy.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
    }),
  );

  const origins = parseCorsOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      // origin undefined acontece em chamadas server-to-server / curl / healthchecks
      if (!origin) return callback(null, true);

      if (origins.includes('*')) return callback(null, true);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const allowed = origins.includes(origin);
      return allowed
        ? callback(null, true)
        : callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}

void bootstrap();
