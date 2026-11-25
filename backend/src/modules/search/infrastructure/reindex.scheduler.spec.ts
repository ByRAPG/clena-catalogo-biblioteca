import { ConfigService } from '@nestjs/config';
import { EmbeddingGenerator } from '../application/ports/embedding-generator';
import { ReindexWorkEmbeddings } from '../application/reindex-work-embeddings.use-case';
import { readReindexConfig } from './reindex-config';
import { ReindexScheduler } from './reindex.scheduler';

const config = (values: Record<string, unknown>): ConfigService =>
  ({ get: (key: string) => values[key] }) as unknown as ConfigService;

const generator = (warmUp?: jest.Mock): EmbeddingGenerator =>
  ({ warmUp }) as unknown as EmbeddingGenerator;

const useCase = (execute: jest.Mock): ReindexWorkEmbeddings =>
  ({ execute }) as unknown as ReindexWorkEmbeddings;

describe('readReindexConfig', () => {
  it('sin configuración validada deja todo desactivado', () => {
    expect(readReindexConfig(config({}))).toEqual({
      enabled: false,
      intervalSeconds: 0,
      batchSize: 16,
    });
  });

  it('acepta números como texto y descarta valores inválidos', () => {
    expect(
      readReindexConfig(
        config({
          SEMANTIC_SEARCH: 'on',
          SEMANTIC_REINDEX_INTERVAL_SECONDS: '60',
          SEMANTIC_REINDEX_BATCH_SIZE: 'abc',
        }),
      ),
    ).toEqual({ enabled: true, intervalSeconds: 60, batchSize: 16 });
  });
});

describe('ReindexScheduler', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('con SEMANTIC_SEARCH distinto de on no programa nada', () => {
    const execute = jest.fn();
    const scheduler = new ReindexScheduler(
      useCase(execute),
      config({}),
      generator(),
    );
    scheduler.onApplicationBootstrap();
    jest.advanceTimersByTime(10_000_000);
    expect(execute).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('ejecuta al arrancar y por intervalo, y limpia el temporizador', async () => {
    const execute = jest.fn().mockResolvedValue({ processed: 1, failed: 0 });
    const scheduler = new ReindexScheduler(
      useCase(execute),
      config({
        SEMANTIC_SEARCH: 'on',
        SEMANTIC_REINDEX_INTERVAL_SECONDS: 10,
        SEMANTIC_REINDEX_BATCH_SIZE: 4,
      }),
      generator(),
    );
    scheduler.onApplicationBootstrap();
    await jest.advanceTimersByTimeAsync(0);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith({ batchSize: 4 });
    await jest.advanceTimersByTimeAsync(25_000);
    expect(execute).toHaveBeenCalledTimes(3);
    scheduler.onModuleDestroy();
    expect(jest.getTimerCount()).toBe(0);
    await jest.advanceTimersByTimeAsync(60_000);
    expect(execute).toHaveBeenCalledTimes(3);
  });

  it('con intervalo 0 solo ejecuta al arrancar', async () => {
    const execute = jest.fn().mockResolvedValue({ processed: 0, failed: 0 });
    new ReindexScheduler(
      useCase(execute),
      config({ SEMANTIC_SEARCH: 'on', SEMANTIC_REINDEX_INTERVAL_SECONDS: 0 }),
      generator(),
    ).onApplicationBootstrap();
    await jest.advanceTimersByTimeAsync(0);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('captura los errores del caso de uso sin romper el arranque', async () => {
    const execute = jest.fn().mockRejectedValue(new Error('sin bd'));
    const scheduler = new ReindexScheduler(
      useCase(execute),
      config({ SEMANTIC_SEARCH: 'on' }),
      generator(),
    );
    expect(() => scheduler.onApplicationBootstrap()).not.toThrow();
    await jest.advanceTimersByTimeAsync(1);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('espera al modelo antes de la primera pasada', async () => {
    let release!: () => void;
    const warmUp = jest.fn(
      () => new Promise<void>((resolve) => (release = resolve)),
    );
    const execute = jest.fn().mockResolvedValue({ processed: 0, failed: 0 });
    new ReindexScheduler(
      useCase(execute),
      config({ SEMANTIC_SEARCH: 'on', SEMANTIC_REINDEX_INTERVAL_SECONDS: 0 }),
      generator(warmUp),
    ).onApplicationBootstrap();
    await jest.advanceTimersByTimeAsync(0);
    expect(execute).not.toHaveBeenCalled();
    release();
    await jest.advanceTimersByTimeAsync(0);
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
