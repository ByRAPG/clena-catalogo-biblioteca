import { EmbeddingVector } from '../../domain/embedding';

export const EMBEDDING_GENERATOR = Symbol('EMBEDDING_GENERATOR');

export type EmbeddingGeneratorState =
  'ready' | 'loading' | 'disabled' | 'error';

export interface EmbeddingGeneratorStatus {
  state: EmbeddingGeneratorState;
  model: string;
  dimensions: number;
}

/**
 * Genera embeddings normalizados (norma 1). Los prefijos `query: ` y
 * `passage: ` del modelo e5 los pone el adaptador, no quien llama.
 * Quien llame debe consultar `status()` antes de pedir vectores.
 */
export interface EmbeddingGenerator {
  embedQuery(text: string): Promise<EmbeddingVector>;
  embedPassages(texts: string[]): Promise<EmbeddingVector[]>;
  status(): EmbeddingGeneratorStatus;
}
