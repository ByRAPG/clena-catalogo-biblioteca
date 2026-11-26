import type { ThrottlerModuleOptions } from '@nestjs/throttler';

// Sin distinguir mayúsculas: Express enruta /API/v1/Auth/login igual que en minúsculas.
const AUTH_PATH = /^\/api\/v1\/auth(\/|$)/i;

export interface ThrottleSettings {
  ttlSeconds: number;
  limit: number;
  authLimit: number;
}

/**
 * Dos límites por IP: `default` para toda la API y `auth` solo para /auth/*.
 * Complementa el bloqueo de cuenta del login, que responde un 401 genérico.
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
