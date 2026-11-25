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

  it('la búsqueda semántica está desactivada y con proveedor fake por defecto', () => {
    const env = validateEnv(base);
    expect(env.SEMANTIC_SEARCH).toBe('off');
    expect(env.EMBEDDING_PROVIDER).toBe('fake');
  });

  it('rechaza valores desconocidos de SEMANTIC_SEARCH y EMBEDDING_PROVIDER', () => {
    expect(() => validateEnv({ ...base, SEMANTIC_SEARCH: 'maybe' })).toThrow(
      /SEMANTIC_SEARCH/,
    );
    expect(() => validateEnv({ ...base, EMBEDDING_PROVIDER: 'x' })).toThrow(
      /EMBEDDING_PROVIDER/,
    );
  });

  it('acepta el proveedor local y trae ruta e hilos por defecto', () => {
    const env = validateEnv({
      ...base,
      SEMANTIC_SEARCH: 'on',
      EMBEDDING_PROVIDER: 'local',
    });
    expect(env.EMBEDDING_MODEL_PATH).toBe('/app/models');
    expect(env.EMBEDDING_INTRA_OP_THREADS).toBe(2);
    expect(() =>
      validateEnv({ ...base, EMBEDDING_INTRA_OP_THREADS: '0' }),
    ).toThrow(/EMBEDDING_INTRA_OP_THREADS/);
  });

  it('valida el reindexado de embeddings', () => {
    const env = validateEnv(base);
    expect(env.SEMANTIC_REINDEX_INTERVAL_SECONDS).toBe(300);
    expect(env.SEMANTIC_REINDEX_BATCH_SIZE).toBe(16);
    expect(
      validateEnv({ ...base, SEMANTIC_REINDEX_INTERVAL_SECONDS: '0' })
        .SEMANTIC_REINDEX_INTERVAL_SECONDS,
    ).toBe(0);
    expect(() =>
      validateEnv({ ...base, SEMANTIC_REINDEX_INTERVAL_SECONDS: '-1' }),
    ).toThrow(/SEMANTIC_REINDEX_INTERVAL_SECONDS/);
    expect(() =>
      validateEnv({ ...base, SEMANTIC_REINDEX_BATCH_SIZE: '0' }),
    ).toThrow(/SEMANTIC_REINDEX_BATCH_SIZE/);
    expect(() =>
      validateEnv({ ...base, SEMANTIC_REINDEX_BATCH_SIZE: 'x' }),
    ).toThrow(/SEMANTIC_REINDEX_BATCH_SIZE/);
  });

  it('calidad de la semántica: valores calibrados por defecto y rango válido', () => {
    expect(validateEnv(base)).toMatchObject({
      SEARCH_MIN_SIMILARITY: 0.84,
      SEARCH_RELATIVE_CUTOFF: 0.04,
      SEARCH_LEXICAL_WEIGHT: 2,
    });
    expect(
      validateEnv({ ...base, SEARCH_MIN_SIMILARITY: '0.7' })
        .SEARCH_MIN_SIMILARITY,
    ).toBe(0.7);
    expect(() =>
      validateEnv({ ...base, SEARCH_MIN_SIMILARITY: '1.5' }),
    ).toThrow(/SEARCH_MIN_SIMILARITY/);
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
