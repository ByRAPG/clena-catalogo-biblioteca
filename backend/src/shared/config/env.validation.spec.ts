import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const base = {
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    JWT_ACCESS_SECRET: 'a',
    JWT_REFRESH_SECRET: 'b',
  };

  it('aplica valores por defecto', () => {
    const env = validateEnv(base);
    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('PUBLIC_WEB_URL tiene valor por defecto y exige http(s)', () => {
    expect(validateEnv(base).PUBLIC_WEB_URL).toBe('http://localhost:5173');
    expect(() =>
      validateEnv({ ...base, PUBLIC_WEB_URL: 'ftp://clena.local' }),
    ).toThrow(/PUBLIC_WEB_URL/);
  });

  it('rechaza secretos JWT cortos en producción', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'production' })).toThrow(
      /JWT_ACCESS_SECRET.*32/,
    );
  });

  it('acepta secretos JWT largos en producción', () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'a'.repeat(32),
        JWT_REFRESH_SECRET: 'b'.repeat(32),
      }),
    ).not.toThrow();
  });

  it('rechaza secretos de ejemplo en producción', () => {
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'Change-Me-' + 'a'.repeat(32),
        JWT_REFRESH_SECRET: 'b'.repeat(32),
      }),
    ).toThrow(/JWT_ACCESS_SECRET.*change-me/);
  });

  it('rechaza secretos JWT iguales en producción', () => {
    const secret = 'x'.repeat(32);
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: secret,
        JWT_REFRESH_SECRET: secret,
      }),
    ).toThrow(/JWT_REFRESH_SECRET.*distinto/);
  });

  it('falla si falta DATABASE_URL', () => {
    expect(() => validateEnv({ ...base, DATABASE_URL: undefined })).toThrow(
      /DATABASE_URL/,
    );
  });
});

describe('validateEnv · endurecimiento', () => {
  const base = {
    DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
    JWT_ACCESS_SECRET: 'a',
    JWT_REFRESH_SECRET: 'b',
  };

  it('rechaza el comodín en CORS_ORIGIN, incluso entre otros orígenes', () => {
    expect(() => validateEnv({ ...base, CORS_ORIGIN: '*' })).toThrow(
      /CORS_ORIGIN/,
    );
    expect(() =>
      validateEnv({ ...base, CORS_ORIGIN: 'http://a.test, *' }),
    ).toThrow(/CORS_ORIGIN/);
  });

  it('TRUST_PROXY: desactivado por defecto, acepta enteros y rechaza el resto', () => {
    expect(validateEnv(base).TRUST_PROXY).toBe(false);
    expect(validateEnv({ ...base, TRUST_PROXY: '1' }).TRUST_PROXY).toBe(1);
    expect(() => validateEnv({ ...base, TRUST_PROXY: 'true' })).toThrow(
      /TRUST_PROXY/,
    );
  });

  it('límites de peticiones con valores por defecto', () => {
    const env = validateEnv(base);
    expect(env.THROTTLE_TTL_SECONDS).toBe(60);
    expect(env.THROTTLE_LIMIT).toBe(300);
    expect(env.THROTTLE_AUTH_LIMIT).toBe(20);
  });
});
