import { EmbeddingGenerator } from '../application/ports/embedding-generator';
import { EMBEDDING_DIMENSIONS } from '../domain/embedding';
import { SemanticSearchDisabledError } from '../domain/search-errors';
import { createEmbeddingGenerator } from './create-embedding-generator';
import { FakeEmbeddingGenerator } from './fake-embedding-generator';
import { NullEmbeddingGenerator } from './null-embedding-generator';

const dot = (a: number[], b: number[]): number =>
  a.reduce((sum, v, i) => sum + v * b[i], 0);

describe('FakeEmbeddingGenerator', () => {
  const generator = new FakeEmbeddingGenerator();

  it('es determinista y de 384 dimensiones', async () => {
    const a = await generator.embedQuery('cálculo diferencial');
    const b = await generator.embedQuery('cálculo diferencial');
    expect(a).toEqual(b);
    expect(a).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(EMBEDDING_DIMENSIONS).toBe(384);
  });

  it('devuelve vectores de norma 1, también con texto vacío', async () => {
    const vectors = await generator.embedPassages(['Física', 'x', '']);
    expect(vectors).toHaveLength(3);
    for (const v of vectors) {
      expect(Math.sqrt(dot(v, v))).toBeCloseTo(1, 6);
    }
  });

  it('textos parecidos se parecen más que textos distintos', async () => {
    const [base, similar, other] = await generator.embedPassages([
      'introduccion al calculo diferencial',
      'calculo diferencial e integral',
      'historia medieval de europa',
    ]);
    expect(dot(base, similar)).toBeGreaterThan(dot(base, other));
  });

  it('ignora tildes y mayúsculas', async () => {
    expect(await generator.embedQuery('ÁLGEBRA Lineal')).toEqual(
      await generator.embedQuery('algebra lineal'),
    );
  });

  it('informa estado ready', () => {
    expect(generator.status()).toMatchObject({
      state: 'ready',
      dimensions: EMBEDDING_DIMENSIONS,
    });
  });
});

describe('NullEmbeddingGenerator', () => {
  const generator: EmbeddingGenerator = new NullEmbeddingGenerator();

  it('informa estado disabled', () => {
    expect(generator.status().state).toBe('disabled');
  });

  it('lanza error de dominio al pedir vectores', async () => {
    await expect(generator.embedQuery('a')).rejects.toBeInstanceOf(
      SemanticSearchDisabledError,
    );
    await expect(generator.embedPassages(['a'])).rejects.toBeInstanceOf(
      SemanticSearchDisabledError,
    );
  });
});

describe('createEmbeddingGenerator', () => {
  it('off entrega el adaptador nulo sin importar el proveedor', () => {
    expect(createEmbeddingGenerator('off', 'fake')).toBeInstanceOf(
      NullEmbeddingGenerator,
    );
    expect(createEmbeddingGenerator('off', 'local')).toBeInstanceOf(
      NullEmbeddingGenerator,
    );
  });

  it('on con fake entrega el generador falso', () => {
    expect(createEmbeddingGenerator('on', 'fake')).toBeInstanceOf(
      FakeEmbeddingGenerator,
    );
  });

  it('on con local falla con mensaje claro', () => {
    expect(() => createEmbeddingGenerator('on', 'local')).toThrow(
      /no está implementado/,
    );
  });
});
