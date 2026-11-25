import type { ExecutionContext } from '@nestjs/common';
import { buildThrottlerOptions } from './throttler.config';

function skipsAuthLimit(originalUrl: string): boolean {
  const options = buildThrottlerOptions({
    ttlSeconds: 60,
    limit: 300,
    authLimit: 20,
  });
  const throttlers = Array.isArray(options) ? options : options.throttlers;
  const auth = throttlers.find((throttler) => throttler.name === 'auth');
  const context = {
    switchToHttp: () => ({ getRequest: () => ({ originalUrl }) }),
  } as unknown as ExecutionContext;
  return Boolean(auth?.skipIf?.(context));
}

describe('buildThrottlerOptions', () => {
  it('aplica el límite de auth a las rutas de /auth', () => {
    expect(skipsAuthLimit('/api/v1/auth/login')).toBe(false);
    expect(skipsAuthLimit('/api/v1/auth/refresh?x=1')).toBe(false);
  });

  it('no se evade cambiando mayúsculas en la ruta', () => {
    expect(skipsAuthLimit('/API/v1/Auth/login')).toBe(false);
  });

  it('no aplica el límite de auth al resto de la API', () => {
    expect(skipsAuthLimit('/api/v1/search/works')).toBe(true);
    expect(skipsAuthLimit('/api/v1/authors')).toBe(true);
  });
});
