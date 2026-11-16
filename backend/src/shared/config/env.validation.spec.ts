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
    const secret = 'x'.repeat(32);
    expect(() =>
      validateEnv({
        ...base,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: secret,
        JWT_REFRESH_SECRET: secret,
      }),
    ).not.toThrow();
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

  it('falla con semántica activa y proveedor local no implementado', () => {
    expect(() =>
      validateEnv({
        ...base,
        SEMANTIC_SEARCH: 'on',
        EMBEDDING_PROVIDER: 'local',
      }),
    ).toThrow(/EMBEDDING_PROVIDER.*no está implementado/);
    expect(() =>
      validateEnv({
        ...base,
        SEMANTIC_SEARCH: 'off',
        EMBEDDING_PROVIDER: 'local',
      }),
    ).not.toThrow();
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
});
