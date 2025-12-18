import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { runWithRequestContext } from './request-context';

function normalizeHeaderValue(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return undefined;
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const incoming = normalizeHeaderValue(req.headers['x-request-id']);
  const requestId = incoming?.trim() || randomUUID();

  // expõe de volta para o client (ajuda debug)
  res.setHeader('x-request-id', requestId);

  runWithRequestContext({ requestId }, () => next());
}
