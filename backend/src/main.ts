import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser'; // <-- add

import { AppModule } from './app.module';
import { requestIdMiddleware } from './infra/logging/request-id.middleware';
import { HttpLoggingInterceptor } from './infra/logging/http-logging.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');

  const frontendUrl =
    config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.use(cookieParser()); // <-- add (antes de guards/rotas é suficiente)

  app.use(requestIdMiddleware);
  app.useGlobalInterceptors(new HttpLoggingInterceptor());

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

void bootstrap().catch((err: unknown) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
