import {
  EmbeddingGenerator,
  EmbeddingGeneratorState,
} from './ports/embedding-generator';
import {
  StaleWork,
  WorkEmbeddingRepository,
} from './ports/work-embedding.repository';
import { ReindexWorkEmbeddings } from './reindex-work-embeddings.use-case';

const MODEL = 'modelo-x@1';
const vec = (n: number): number[] => [n];

const works = (count: number): StaleWork[] =>
  Array.from({ length: count }, (_, i) => ({
    workId: `w${String(i + 1).padStart(3, '0')}`,
    sourceText: `texto ${i + 1}`,
    sourceHash: `h${i + 1}`,
  }));

/** Repositorio en memoria: findStale ordena por id y excluye las ya guardadas. */
class MemoryRepo implements WorkEmbeddingRepository {
  saved = new Map<string, { model: string; hash: string }>();
  failSave = new Set<string>();
  findStaleCalls: number[] = [];

  constructor(private readonly all: StaleWork[]) {}

  findStale(model: string, limit: number): Promise<StaleWork[]> {
    this.findStaleCalls.push(limit);
    return Promise.resolve(
      this.all
        .filter((w) => {
          const s = this.saved.get(w.workId);
          return !s || s.model !== model || s.hash !== w.sourceHash;
        })
        .slice(0, limit),
    );
  }

  save(
    workId: string,
    _vector: readonly number[],
    model: string,
    sourceHash: string,
  ): Promise<void> {
    if (this.failSave.has(workId)) return Promise.reject(new Error('db caída'));
    this.saved.set(workId, { model, hash: sourceHash });
    return Promise.resolve();
  }

  searchNearest(): Promise<never[]> {
    return Promise.resolve([]);
  }
}

type FakeGenerator = EmbeddingGenerator & {
  state: EmbeddingGeneratorState;
  embedPassages: jest.Mock;
};

const generator = (
  state: EmbeddingGeneratorState = 'ready',
  embed?: (texts: string[]) => Promise<number[][]>,
): FakeGenerator => {
  const g = {
    state,
    embedQuery: jest.fn(),
    embedPassages: jest.fn(
      embed ??
        ((texts: string[]) => Promise.resolve(texts.map((_, i) => vec(i)))),
    ),
    status: () => ({ state: g.state, model: MODEL, dimensions: 1 }),
  };
  return g as unknown as FakeGenerator;
};

describe('ReindexWorkEmbeddings', () => {
  it('no hace nada si no hay obras obsoletas', async () => {
    const repo = new MemoryRepo([]);
    const gen = generator();
    const summary = await new ReindexWorkEmbeddings(gen, repo).execute();
    expect(summary).toMatchObject({
      processed: 0,
      failed: 0,
      pending: 0,
      batches: 0,
      truncated: false,
      model: MODEL,
    });
    expect(summary.skipped).toBeUndefined();
    expect(gen.embedPassages).not.toHaveBeenCalled();
  });

  it('procesa varios lotes con el hash del repositorio y el modelo del generador', async () => {
    const repo = new MemoryRepo(works(5));
    const summary = await new ReindexWorkEmbeddings(generator(), repo).execute({
      batchSize: 2,
    });
    expect(summary).toMatchObject({ processed: 5, failed: 0, batches: 3 });
    expect(repo.saved.get('w003')).toEqual({ model: MODEL, hash: 'h3' });
  });

  it('es idempotente: una segunda ejecución no procesa nada', async () => {
    const repo = new MemoryRepo(works(3));
    const useCase = new ReindexWorkEmbeddings(generator(), repo);
    await useCase.execute();
    const second = await useCase.execute();
    expect(second.processed).toBe(0);
    expect(second.batches).toBe(0);
  });

  it('reprocesa una obra cuyo texto cambió', async () => {
    const all = works(2);
    const repo = new MemoryRepo(all);
    const useCase = new ReindexWorkEmbeddings(generator(), repo);
    await useCase.execute();
    all[0].sourceHash = 'nuevo';
    expect((await useCase.execute()).processed).toBe(1);
  });

  it.each(['disabled', 'loading', 'error'] as const)(
    'con el generador %s no pide nada y lo indica',
    async (state) => {
      const repo = new MemoryRepo(works(2));
      const gen = generator(state);
      const summary = await new ReindexWorkEmbeddings(gen, repo).execute();
      expect(summary.skipped).toBe(
        state === 'disabled' ? 'disabled' : 'not-ready',
      );
      expect(summary.processed).toBe(0);
      expect(repo.findStaleCalls).toEqual([]);
      expect(gen.embedPassages).not.toHaveBeenCalled();
    },
  );

  it('se detiene si el generador deja de estar listo a mitad de ejecución', async () => {
    const repo = new MemoryRepo(works(4));
    const gen: FakeGenerator = generator('ready', (texts) => {
      gen.state = 'error';
      return Promise.resolve(texts.map(() => vec(0)));
    });
    const summary = await new ReindexWorkEmbeddings(gen, repo).execute({
      batchSize: 2,
    });
    expect(summary).toMatchObject({ processed: 2, skipped: 'not-ready' });
  });

  it('un fallo de guardado en una obra no tumba el resto ni se reintenta', async () => {
    const repo = new MemoryRepo(works(4));
    repo.failSave.add('w002');
    const summary = await new ReindexWorkEmbeddings(generator(), repo).execute({
      batchSize: 2,
    });
    expect(summary).toMatchObject({ processed: 3, failed: 1, pending: 1 });
    expect(summary.failures).toEqual([{ workId: 'w002', message: 'db caída' }]);
    expect(repo.saved.has('w004')).toBe(true);
  });

  it('si falla el lote entero, aísla la obra culpable reintentando una a una', async () => {
    const repo = new MemoryRepo(works(3));
    const gen = generator('ready', (texts) =>
      texts.length > 1 || texts[0] === 'texto 2'
        ? Promise.reject(new Error('modelo falló'))
        : Promise.resolve([vec(0)]),
    );
    const summary = await new ReindexWorkEmbeddings(gen, repo).execute();
    expect(summary).toMatchObject({ processed: 2, failed: 1, batches: 1 });
    expect(summary.failures[0]).toEqual({
      workId: 'w002',
      message: 'modelo falló',
    });
  });

  it('un lote que no avanza (todo falla) termina sin bucle infinito', async () => {
    const repo = new MemoryRepo(works(5));
    const gen = generator('ready', () => Promise.reject(new Error('caído')));
    const summary = await new ReindexWorkEmbeddings(gen, repo).execute({
      batchSize: 2,
    });
    expect(summary).toMatchObject({ processed: 0, failed: 5, pending: 5 });
    // 3 lotes y, tras cada fallo, un reintento por obra (5).
    expect(gen.embedPassages).toHaveBeenCalledTimes(3 + 5);
  });

  it('las fallidas no bloquean a las demás aunque ocupen los primeros ids', async () => {
    const repo = new MemoryRepo(works(6));
    repo.failSave.add('w001').add('w002');
    const summary = await new ReindexWorkEmbeddings(generator(), repo).execute({
      batchSize: 2,
    });
    expect(summary).toMatchObject({ processed: 4, failed: 2 });
  });

  it('si el generador devuelve otro número de vectores, reintenta una a una', async () => {
    const repo = new MemoryRepo(works(2));
    let calls = 0;
    const gen = generator('ready', (texts) =>
      Promise.resolve(++calls === 1 ? [] : texts.map(() => vec(0))),
    );
    const summary = await new ReindexWorkEmbeddings(gen, repo).execute();
    expect(summary).toMatchObject({ processed: 2, failed: 0 });
  });

  it('no arranca una segunda ejecución solapada', async () => {
    const repo = new MemoryRepo(works(2));
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const gen = generator('ready', async (texts) => {
      await gate;
      return texts.map(() => vec(0));
    });
    const useCase = new ReindexWorkEmbeddings(gen, repo);
    const first = useCase.execute();
    const second = await useCase.execute();
    expect(second.skipped).toBe('already-running');
    release();
    expect((await first).processed).toBe(2);
    // Terminada la primera, se puede volver a ejecutar.
    expect((await useCase.execute()).skipped).toBeUndefined();
  });

  it('libera el bloqueo si el repositorio lanza', async () => {
    const repo = new MemoryRepo(works(1));
    jest.spyOn(repo, 'findStale').mockRejectedValueOnce(new Error('sin bd'));
    const useCase = new ReindexWorkEmbeddings(generator(), repo);
    await expect(useCase.execute()).rejects.toThrow('sin bd');
    expect((await useCase.execute()).processed).toBe(1);
  });

  it('respeta el tope de lotes e informa lo que queda', async () => {
    const repo = new MemoryRepo(works(7));
    const summary = await new ReindexWorkEmbeddings(generator(), repo).execute({
      batchSize: 2,
      maxBatches: 2,
    });
    expect(summary).toMatchObject({
      processed: 4,
      batches: 2,
      truncated: true,
      pending: 2,
    });
    const next = await new ReindexWorkEmbeddings(generator(), repo).execute({
      batchSize: 2,
      maxBatches: 10,
    });
    expect(next).toMatchObject({ processed: 3, truncated: false });
  });

  it('usa valores por defecto si las opciones no son válidas', async () => {
    const repo = new MemoryRepo(works(20));
    const summary = await new ReindexWorkEmbeddings(generator(), repo).execute({
      batchSize: -1,
      maxBatches: 0,
    });
    expect(summary).toMatchObject({ processed: 20, batches: 2 });
  });

  it('describe el error si no es una instancia de Error', async () => {
    const repo = new MemoryRepo(works(1));
    const gen = generator('ready', () => Promise.reject('texto plano'));
    const summary = await new ReindexWorkEmbeddings(gen, repo).execute();
    expect(summary.failures[0].message).toBe('texto plano');
  });
});
