import { EmbeddingGenerator } from '../application/ports/embedding-generator';
import { FakeEmbeddingGenerator } from './fake-embedding-generator';
import { NullEmbeddingGenerator } from './null-embedding-generator';

/** Elige el adaptador según SEMANTIC_SEARCH y EMBEDDING_PROVIDER. */
export function createEmbeddingGenerator(
  semanticSearch: 'on' | 'off',
  provider: 'fake' | 'local',
): EmbeddingGenerator {
  if (semanticSearch === 'off') return new NullEmbeddingGenerator();
  if (provider === 'fake') return new FakeEmbeddingGenerator();
  throw new Error(
    'EMBEDDING_PROVIDER=local aún no está implementado; usa fake o SEMANTIC_SEARCH=off',
  );
}
