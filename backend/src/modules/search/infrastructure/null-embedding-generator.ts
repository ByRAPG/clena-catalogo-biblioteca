import {
  EmbeddingGenerator,
  EmbeddingGeneratorStatus,
} from '../application/ports/embedding-generator';
import { EMBEDDING_DIMENSIONS, EmbeddingVector } from '../domain/embedding';
import { SemanticSearchDisabledError } from '../domain/search-errors';

/**
 * Adaptador para SEMANTIC_SEARCH=off. Quien llame debe consultar `status()`
 * (state `disabled`) antes; si pide vectores igualmente, lanza
 * SemanticSearchDisabledError en lugar de devolver vectores falsos.
 */
export class NullEmbeddingGenerator implements EmbeddingGenerator {
  embedQuery(): Promise<EmbeddingVector> {
    return Promise.reject(new SemanticSearchDisabledError());
  }

  embedPassages(): Promise<EmbeddingVector[]> {
    return Promise.reject(new SemanticSearchDisabledError());
  }

  status(): EmbeddingGeneratorStatus {
    return {
      state: 'disabled',
      model: 'none',
      dimensions: EMBEDDING_DIMENSIONS,
    };
  }
}
