import type { ThrottlerModuleOptions } from '@nestjs/throttler';

const AUTH_PATH = /^\/api\/v1\/auth(\/|$)/;

export interface ThrottleSettings {
  ttlSeconds: number;
  limit: number;
  authLimit: number;
}

/**
 * Dos límites por IP: `default` para toda la API y `auth` solo para /auth/*.
 * Complementa (no reemplaza) el bloqueo de cuenta del login (AccountLockedError).
 * Al superarlos, ThrottlerGuard responde 429 con la cabecera Retry-After.
 */
export function buildThrottlerOptions(
  settings: ThrottleSettings,
): ThrottlerModuleOptions {
  const ttl = settings.ttlSeconds * 1000;
  return [
    { name: 'default', ttl, limit: settings.limit },
    {
      name: 'auth',
      ttl,
      limit: settings.authLimit,
      skipIf: (context) => {
        const req = context
          .switchToHttp()
          .getRequest<{ originalUrl?: string }>();
        return !AUTH_PATH.test((req.originalUrl ?? '').split('?')[0]);
      },
    },
  ];
}
