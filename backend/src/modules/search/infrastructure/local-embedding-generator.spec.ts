import { EMBEDDING_DIMENSIONS } from '../domain/embedding';
import {
  FeatureExtractor,
  LocalEmbeddingGenerator,
  LocalEmbeddingOptions,
  TransformersLibrary,
} from './local-embedding-generator';

function fakeLibrary(extractor: FeatureExtractor) {
  const library = {
    env: {
      allowRemoteModels: true,
      allowLocalModels: false,
      localModelPath: '',
      useFSCache: true,
      useBrowserCache: true,
    },
    pipeline: jest.fn().mockResolvedValue(extractor),
  };
  return library as typeof library & TransformersLibrary;
}

const unitVector = (): number[] => {
  const v = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  v[0] = 1;
  return v;
};

describe('LocalEmbeddingGenerator', () => {
  const build = (
    extractor: FeatureExtractor,
    overrides: Partial<LocalEmbeddingOptions> = {},
  ) => {
    const library = fakeLibrary(extractor);
    const generator = new LocalEmbeddingGenerator({
      modelPath: '/models',
      intraOpNumThreads: 2,
      loadLibrary: () => Promise.resolve(library),
      ...overrides,
    });
    return { generator, library };
  };
  const echoExtractor = () =>
    jest.fn<ReturnType<FeatureExtractor>, Parameters<FeatureExtractor>>(
      (texts) =>
        Promise.resolve({ tolist: () => texts.map(() => unitVector()) }),
    );

  it('empieza en loading y pasa a ready tras warmUp', async () => {
    const { generator } = build(echoExtractor());
    expect(generator.status()).toEqual({
      state: 'loading',
      model: 'multilingual-e5-small-q8',
      dimensions: 384,
    });
    await generator.warmUp();
    expect(generator.status().state).toBe('ready');
  });

  it('carga sin red, sin caché escribible, con q8 e hilos fijos', async () => {
    const { generator, library } = build(echoExtractor(), {
      intraOpNumThreads: 3,
    });
    await generator.warmUp();
    expect(library.env).toMatchObject({
      allowRemoteModels: false,
      allowLocalModels: true,
      localModelPath: '/models',
      useFSCache: false,
      useBrowserCache: false,
    });
    expect(library.pipeline).toHaveBeenCalledWith(
      'feature-extraction',
      'Xenova/multilingual-e5-small',
      {
        dtype: 'q8',
        local_files_only: true,
        session_options: { intraOpNumThreads: 3 },
      },
    );
  });

  it('carga una sola vez aunque se llame varias veces', async () => {
    const { generator, library } = build(echoExtractor());
    await Promise.all([generator.warmUp(), generator.warmUp()]);
    await generator.embedQuery('hola');
    expect(library.pipeline).toHaveBeenCalledTimes(1);
  });

  it('antepone query: a la consulta y usa mean pooling normalizado', async () => {
    const extractor = echoExtractor();
    const { generator } = build(extractor);
    const vector = await generator.embedQuery('ecología');
    expect(extractor).toHaveBeenCalledWith(['query: ecología'], {
      pooling: 'mean',
      normalize: true,
    });
    expect(vector).toHaveLength(EMBEDDING_DIMENSIONS);
  });

  it('antepone passage: y procesa los pasajes por lotes', async () => {
    const extractor = echoExtractor();
    const { generator } = build(extractor);
    const texts = Array.from({ length: 20 }, (_, i) => `t${i}`);
    const vectors = await generator.embedPassages(texts);
    expect(vectors).toHaveLength(20);
    expect(extractor).toHaveBeenCalledTimes(2);
    expect(extractor.mock.calls[0][0]).toHaveLength(16);
    expect(extractor.mock.calls[0][0][0]).toBe('passage: t0');
    expect(extractor.mock.calls[1][0]).toEqual([
      'passage: t16',
      'passage: t17',
      'passage: t18',
      'passage: t19',
    ]);
  });

  it('una lista vacía no invoca el modelo', async () => {
    const extractor = echoExtractor();
    const { generator } = build(extractor);
    expect(await generator.embedPassages([])).toEqual([]);
    expect(extractor).not.toHaveBeenCalled();
  });

  it('si la carga falla queda en error, warmUp no rechaza y los vectores sí', async () => {
    const generator = new LocalEmbeddingGenerator({
      modelPath: '/models',
      intraOpNumThreads: 2,
      loadLibrary: () => Promise.reject(new Error('sin archivos')),
    });
    await expect(generator.warmUp()).resolves.toBeUndefined();
    expect(generator.status().state).toBe('error');
    await expect(generator.embedQuery('a')).rejects.toThrow('sin archivos');
  });
});
