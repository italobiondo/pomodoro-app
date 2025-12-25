import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';
import { getRequestContext } from './request-context';

function stripQuery(url: string | undefined): string | undefined {
  if (!url) return url;
  const idx = url.indexOf('?');
  return idx >= 0 ? url.slice(0, idx) : url;
}

function safeUrl(req: Request): string | undefined {
  const originalUrl =
    typeof req.originalUrl === 'string' ? req.originalUrl : undefined;
  const url = typeof req.url === 'string' ? req.url : undefined;
  return stripQuery(originalUrl ?? url);
}

function safeIp(req: Request): string | undefined {
  const xff = req.headers['x-forwarded-for'];
  const ipFromXff =
    typeof xff === 'string' ? xff.split(',')[0]?.trim() : undefined;

  const ip = ipFromXff || req.ip || req.socket?.remoteAddress;
  return typeof ip === 'string' ? ip : undefined;
}

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const method = req.method;
    const url = safeUrl(req);

    const startedAt = Date.now();

    const ctx = getRequestContext();
    const requestId =
      ctx?.requestId ||
      (typeof res.getHeader === 'function'
        ? res.getHeader('x-request-id')
        : undefined) ||
      req.headers['x-request-id'];

    const user = req.user as { id?: string } | undefined;
    const userId = typeof user?.id === 'string' ? user.id : null;

    const ip = safeIp(req) ?? null;

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - startedAt;

          this.logger.log(
            JSON.stringify({
              requestId: typeof requestId === 'string' ? requestId : null,
              userId,
              ip,
              method,
              url: url ?? null,
              statusCode: res.statusCode,
              ms,
            }),
          );
        },
        error: (err: unknown) => {
          const ms = Date.now() - startedAt;

          const e = err instanceof Error ? err : new Error(String(err));

          this.logger.error(
            JSON.stringify({
              requestId: typeof requestId === 'string' ? requestId : null,
              userId,
              ip,
              method,
              url: url ?? null,
              statusCode: res.statusCode ?? 'ERR',
              ms,
              errorName: e.name,
              errorMessage: e.message,
            }),
            e.stack,
          );
        },
      }),
    );
  }
}
