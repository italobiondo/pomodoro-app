import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  /**
   * Usa userId quando existir (autenticado).
   * Caso contrário, usa IP (fallback).
   */
  protected override getTracker(req: Request): string {
    const user = req.user as { id?: string } | undefined;
    const userId = user?.id;

    if (typeof userId === 'string' && userId.length > 0) {
      return userId;
    }

    const xff = req.headers['x-forwarded-for'];
    const ipFromXff =
      typeof xff === 'string' ? xff.split(',')[0]?.trim() : undefined;

    const ip = ipFromXff || req.ip || req.socket?.remoteAddress;

    return typeof ip === 'string' && ip.length > 0 ? ip : 'unknown';
  }

  protected override getRequestResponse(context: ExecutionContext): {
    req: Request;
    res: Response;
  } {
    const http = context.switchToHttp();
    return {
      req: http.getRequest<Request>(),
      res: http.getResponse<Response>(),
    };
  }
}
