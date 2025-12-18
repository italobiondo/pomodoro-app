/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { originalUrl?: string }>();
    const res = http.getResponse<{ statusCode?: number }>();

    const method = (req as any)?.method;
    const url = (req as any)?.originalUrl || (req as any)?.url;

    const startedAt = Date.now();

    // log de entrada (opcional — pode comentar se achar verboso)
    this.logger.log(`start ${method} ${url}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - startedAt;
          const statusCode = (res as any)?.statusCode;
          this.logger.log(`end ${method} ${url} ${statusCode} ${ms}ms`);
        },
        error: (err) => {
          const ms = Date.now() - startedAt;
          const statusCode = (res as any)?.statusCode;
          this.logger.error(
            `end ${method} ${url} ${statusCode ?? 'ERR'} ${ms}ms`,
            (err as Error)?.stack,
          );
        },
      }),
    );
  }
}
