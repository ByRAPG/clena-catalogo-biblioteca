/** @jest-environment ../test/jest-env-native-arrays.js */
import { existsSync } from 'node:fs';
import { EMBEDDING_DIMENSIONS } from '../domain/embedding';
import { LocalEmbeddingGenerator } from './local-embedding-generator';

/**
 * Prueba con el modelo real. Se salta por defecto (CI no descarga nada).
 * Para activarla: EMBEDDING_REAL_MODEL_PATH=<carpeta con Xenova/multilingual-e5-small>
 * (se genera con `node scripts/fetch-embedding-model.mjs <carpeta>`).
 */
const modelPath = process.env.EMBEDDING_REAL_MODEL_PATH;
const describeReal =
  modelPath && existsSync(modelPath) ? describe : describe.skip;

const dot = (a: number[], b: number[]): number =>
  a.reduce((sum, v, i) => sum + v * b[i], 0);

describeReal('LocalEmbeddingGenerator con el modelo real', () => {
  const generator = new LocalEmbeddingGenerator({
    modelPath: modelPath ?? '',
    intraOpNumThreads: 2,
  });

  beforeAll(async () => {
    await generator.warmUp();
  }, 120_000);

  it('queda ready y entrega vectores de 384 dimensiones con norma 1', async () => {
    expect(generator.status().state).toBe('ready');
    const vector = await generator.embedQuery('cuidado del medio ambiente');
    expect(vector).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(Math.sqrt(dot(vector, vector))).toBeCloseTo(1, 4);
  });

  it('acerca temas relacionados sin coincidencia literal', async () => {
    const query = await generator.embedQuery('cuidado del medio ambiente');
    const [ecology, cooking] = await generator.embedPassages([
      'EcologÃ­a y conservaciÃ³n de los ecosistemas',
      'Recetas de cocina tradicional italiana',
    ]);
    expect(dot(query, ecology)).toBeGreaterThan(dot(query, cooking));
  });
});
