import { EmbeddingGenerator } from './ports/embedding-generator';
import { SearchRepository } from './ports/search.repository';
import { WorkEmbeddingRepository } from './ports/work-embedding.repository';
import {
  DEFAULT_SEMANTIC_QUERY_OPTIONS,
  QueryEmbedder,
  SemanticQueryOptions,
} from './query-embedder';
import { SearchWorks } from './search-works.use-case';
import { EMBEDDING_DIMENSIONS } from '../domain/embedding';
import { WorkSummary } from '../domain/work-summary';

const summary = (id: string): WorkSummary => ({ id }) as WorkSummary;
const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);

function setup(
  options: {
    state?: 'ready' | 'loading' | 'disabled' | 'error';
    embedQuery?: () => Promise<number[]>;
    nearest?: string[];
    lexical?: string[];
    semanticOptions?: Partial<SemanticQueryOptions>;
  } = {},
) {
  const repo: jest.Mocked<SearchRepository> = {
    searchWorks: jest.fn().mockResolvedValue({ items: [], total: 23 }),
    rankLexical: jest
      .fn()
      .mockResolvedValue(
        (options.lexical ?? []).map((id) => ({ id, matchedOn: 'title' })),
      ),
    findSummaries: jest
      .fn()
      .mockImplementation((hits: { id: string }[]) =>
        Promise.resolve(hits.map((h) => summary(h.id))),
      ),
    findWorkDetail: jest.fn(),
    listCategories: jest.fn(),
    listRooms: jest.fn(),
  };
  const embeddings: jest.Mocked<WorkEmbeddingRepository> = {
    findStale: jest.fn(),
    save: jest.fn(),
    searchNearest: jest
      .fn()
      .mockResolvedValue(
        (options.nearest ?? []).map((workId) => ({ workId, score: 0.9 })),
      ),
  };
  const generator: EmbeddingGenerator = {
    embedQuery: jest.fn(options.embedQuery ?? (() => Promise.resolve(vector))),
    embedPassages: jest.fn(),
    status: () => ({
      state: options.state ?? 'ready',
      model: 'test',
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  };
  const embedder = new QueryEmbedder(generator, {
    ...DEFAULT_SEMANTIC_QUERY_OPTIONS,
    ...options.semanticOptions,
  });
  return {
    repo,
    embeddings,
    generator,
    useCase: new SearchWorks(repo, embeddings, embedder),
  };
}

describe('SearchWorks', () => {
  it('envía criterios normalizados al repositorio y arma la meta', async () => {
    const { repo, useCase } = setup({ state: 'disabled' });
    const result = await useCase.execute({ q: 'SOLEDÁD', page: 2 });
    expect(repo.searchWorks).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'soledad', page: 2, pageSize: 10 }),
    );
    expect(result).toEqual({
      data: [],
      meta: {
        page: 2,
        pageSize: 10,
        total: 23,
        mode: 'lexical',
        degraded: false,
      },
    });
  });

  it('propaga el error de criterios inválidos sin consultar', async () => {
    const { repo, useCase } = setup();
    await expect(useCase.execute({ pageSize: 99 })).rejects.toThrow('pageSize');
    await expect(useCase.execute({ mode: 'raro' })).rejects.toThrow('mode');
    expect(repo.searchWorks).not.toHaveBeenCalled();
  });

  it('con la semántica apagada, todo es léxico sin degradar', async () => {
    const { repo, embeddings, useCase } = setup({ state: 'disabled' });
    const result = await useCase.execute({ q: 'ecologia' });
    expect(result.meta).toMatchObject({ mode: 'lexical', degraded: false });
    expect(embeddings.searchNearest).not.toHaveBeenCalled();
    expect(repo.searchWorks).toHaveBeenCalled();
  });

  it('pedir híbrida con la semántica apagada degrada', async () => {
    const { useCase } = setup({ state: 'disabled' });
    const result = await useCase.execute({ q: 'ecologia', mode: 'hybrid' });
    expect(result.meta).toMatchObject({ mode: 'lexical', degraded: true });
  });

  it('por defecto es híbrida y fusiona con RRF', async () => {
    const { repo, embeddings, useCase } = setup({
      lexical: ['a', 'b', 'c'],
      nearest: ['c', 'd'],
    });
    const result = await useCase.execute({
      q: 'ecologia',
      categoryId: '5b0f7d4e-1c1e-5a53-a3f1-0d7f4a2c9e11',
      available: true,
    });
    expect(result.data.map((w) => w.id)).toEqual(['c', 'a', 'b', 'd']);
    expect(result.meta).toMatchObject({
      mode: 'hybrid',
      degraded: false,
      total: 4,
    });
    expect(embeddings.searchNearest).toHaveBeenCalledWith(vector, 100, {
      categoryId: '5b0f7d4e-1c1e-5a53-a3f1-0d7f4a2c9e11',
      roomId: null,
      onlyAvailable: true,
    });
    expect(repo.rankLexical).toHaveBeenCalledWith(expect.anything(), 100);
    // matchedOn solo viene de la léxica.
    expect(repo.findSummaries).toHaveBeenCalledWith([
      { id: 'c', matchedOn: 'title' },
      { id: 'a', matchedOn: 'title' },
      { id: 'b', matchedOn: 'title' },
      { id: 'd', matchedOn: null },
    ]);
  });

  it('pagina sobre la lista fusionada', async () => {
    const { useCase } = setup({
      lexical: ['a', 'b', 'c', 'd', 'e'],
      nearest: [],
    });
    const result = await useCase.execute({
      q: 'x',
      page: 2,
      pageSize: 2,
      mode: 'hybrid',
    });
    expect(result.data.map((w) => w.id)).toEqual(['c', 'd']);
    expect(result.meta.total).toBe(5);
  });

  it('el modo semantic usa solo el ranking vectorial', async () => {
    const { repo, useCase } = setup({ nearest: ['x', 'y'] });
    const result = await useCase.execute({ q: 'ecologia', mode: 'semantic' });
    expect(result.data.map((w) => w.id)).toEqual(['x', 'y']);
    expect(result.meta).toMatchObject({ mode: 'semantic', degraded: false });
    expect(repo.rankLexical).not.toHaveBeenCalled();
  });

  it('el modo lexical no toca el modelo', async () => {
    const { generator, useCase } = setup();
    const result = await useCase.execute({ q: 'ecologia', mode: 'lexical' });
    expect(result.meta).toMatchObject({ mode: 'lexical', degraded: false });
    expect(generator.embedQuery).not.toHaveBeenCalled();
  });

  it('sin texto responde como antes aunque se pida semántica', async () => {
    const { generator, repo, useCase } = setup();
    const result = await useCase.execute({ mode: 'semantic' });
    expect(result.meta).toMatchObject({ mode: 'lexical', degraded: false });
    expect(repo.searchWorks).toHaveBeenCalled();
    expect(generator.embedQuery).not.toHaveBeenCalled();
  });

  it.each(['loading', 'error'] as const)(
    'degrada si el generador está en estado %s',
    async (state) => {
      const { useCase } = setup({ state });
      const result = await useCase.execute({ q: 'ecologia' });
      expect(result.meta).toMatchObject({ mode: 'lexical', degraded: true });
    },
  );

  it('degrada si el generador falla', async () => {
    const { useCase } = setup({
      embedQuery: () => Promise.reject(new Error('boom')),
    });
    const result = await useCase.execute({ q: 'ecologia' });
    expect(result.meta).toMatchObject({ mode: 'lexical', degraded: true });
  });

  it('degrada si la búsqueda vectorial falla', async () => {
    const { embeddings, useCase } = setup();
    embeddings.searchNearest.mockRejectedValue(new Error('db'));
    const result = await useCase.execute({ q: 'ecologia' });
    expect(result.meta).toMatchObject({ mode: 'lexical', degraded: true });
  });

  it('degrada si el generador supera el tiempo máximo', async () => {
    const { useCase } = setup({
      embedQuery: () => new Promise<number[]>(() => undefined),
      semanticOptions: { timeoutMs: 20 },
    });
    const result = await useCase.execute({ q: 'ecologia' });
    expect(result.meta).toMatchObject({ mode: 'lexical', degraded: true });
  });

  it('degrada en lugar de encolar cuando el límite está lleno', async () => {
    const { generator, useCase } = setup({
      embedQuery: () => new Promise<number[]>(() => undefined),
      semanticOptions: { timeoutMs: 20, maxConcurrent: 1 },
    });
    const first = useCase.execute({ q: 'uno' });
    // La inferencia colgada de «uno» sigue ocupando el cupo tras su timeout.
    await first;
    const second = await useCase.execute({ q: 'dos' });
    expect(second.meta.degraded).toBe(true);
    expect(generator.embedQuery).toHaveBeenCalledTimes(1);
  });

  it('cachea el vector de la consulta normalizada', async () => {
    const { generator, useCase } = setup({ nearest: ['a'] });
    await useCase.execute({ q: 'Ecología' });
    await useCase.execute({ q: 'ecologia' });
    expect(generator.embedQuery).toHaveBeenCalledTimes(1);
  });
});
