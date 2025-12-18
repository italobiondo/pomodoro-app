import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { requestIdMiddleware } from './infra/logging/request-id.middleware';
import { JsonLogger } from './infra/logging/json-logger.service';
import { HttpLoggingInterceptor } from './infra/logging/http-logging.interceptor';

function parseCorsOrigins(): (string | RegExp)[] {
  const raw = (process.env.FRONTEND_URL || 'http://localhost:3000').trim();

  if (raw === '*') return ['*'];

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  // Usa logger estruturado desde o bootstrap
  const app = await NestFactory.create(AppModule, {
    logger: new JsonLogger(),
  });

  // requestId + AsyncLocalStorage context (precisa vir bem cedo)
  app.use(requestIdMiddleware);

  app.use(cookieParser());

  app.use(
    helmet({
      contentSecurityPolicy: false,
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

  // logs por request (latência/status)
  app.useGlobalInterceptors(new HttpLoggingInterceptor());

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}

void bootstrap();
