import { normalizeText } from '../../../shared/domain/normalize-text';
import {
  EmbeddingGenerator,
  EmbeddingGeneratorStatus,
} from '../application/ports/embedding-generator';
import { EMBEDDING_DIMENSIONS, EmbeddingVector } from '../domain/embedding';

const NGRAM_SIZES = [2, 3];

/** Hash FNV-1a de 32 bits. */
function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Generador determinista sin modelo para pruebas y CI: proyecta n-gramas de
 * caracteres del texto normalizado (sin tildes ni mayúsculas) a un vector de
 * 384 dimensiones con norma 1. Textos parecidos dan vectores parecidos.
 */
export class FakeEmbeddingGenerator implements EmbeddingGenerator {
  embedQuery(text: string): Promise<EmbeddingVector> {
    return Promise.resolve(this.embed(text));
  }

  embedPassages(texts: string[]): Promise<EmbeddingVector[]> {
    return Promise.resolve(texts.map((text) => this.embed(text)));
  }

  status(): EmbeddingGeneratorStatus {
    return {
      state: 'ready',
      model: 'fake-ngram-hash',
      dimensions: EMBEDDING_DIMENSIONS,
    };
  }

  private embed(text: string): EmbeddingVector {
    const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
    const padded = ` ${normalizeText(text)} `;
    for (const size of NGRAM_SIZES) {
      for (let i = 0; i + size <= padded.length; i++) {
        const hash = fnv1a(padded.slice(i, i + size));
        const sign = (hash >>> 31) & 1 ? -1 : 1;
        vector[hash % EMBEDDING_DIMENSIONS] += sign;
      }
    }
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm === 0) {
      // Vector unitario fijo para conservar la norma 1.
      vector[0] = 1;
      return vector;
    }
    return vector.map((v) => v / norm);
  }
}
