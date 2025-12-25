import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import { requestIdMiddleware } from './infra/logging/request-id.middleware';
import { HttpLoggingInterceptor } from './infra/logging/http-logging.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  // Prefixo de API
  app.setGlobalPrefix('api');

  // CORS
  const frontendUrl =
    config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Middleware request-id (correlação)
  app.use(requestIdMiddleware);

  // Interceptor de logging HTTP (sem dados sensíveis)
  app.useGlobalInterceptors(new HttpLoggingInterceptor());

  // ValidationPipe global (hardening)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
      stopAtFirstError: false,
    }),
  );

  const port = Number(config.get<string>('PORT') ?? 4000);
  await app.listen(port);
}

// Evita no-floating-promises
void bootstrap().catch((err: unknown) => {
  // log mínimo e explícito

  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
