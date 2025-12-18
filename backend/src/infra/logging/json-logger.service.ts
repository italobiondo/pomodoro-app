import { ConsoleLogger, Injectable } from '@nestjs/common';
import { getRequestContext } from './request-context';

type Level = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

@Injectable()
export class JsonLogger extends ConsoleLogger {
  private write(
    level: Level,
    message: unknown,
    context?: string,
    trace?: string,
  ) {
    const ctx = getRequestContext();
    const payload: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      context: context ?? this.context,
      requestId: ctx?.requestId ?? null,
      message: typeof message === 'string' ? message : safeJson(message),
    };

    if (trace) payload.trace = trace;

    // stdout/stderr conforme nível
    const line = JSON.stringify(payload);
    if (level === 'error') {
      process.stderr.write(line + '\n');
    } else {
      process.stdout.write(line + '\n');
    }
  }

  override log(message: any, context?: string) {
    this.write('log', message, context);
  }

  override error(message: any, trace?: string, context?: string) {
    this.write('error', message, context, trace);
  }

  override warn(message: any, context?: string) {
    this.write('warn', message, context);
  }

  override debug(message: any, context?: string) {
    this.write('debug', message, context);
  }

  override verbose(message: any, context?: string) {
    this.write('verbose', message, context);
  }
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
}
