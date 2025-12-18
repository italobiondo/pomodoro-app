import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
  requestId: string;
};

const als = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(ctx: RequestContext, fn: () => T): T {
  return als.run(ctx, fn);
}

export function getRequestContext(): RequestContext | undefined {
  return als.getStore();
}
