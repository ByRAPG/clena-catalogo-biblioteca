import { EmbeddingGenerator } from '../application/ports/embedding-generator';
import { FakeEmbeddingGenerator } from './fake-embedding-generator';
import { NullEmbeddingGenerator } from './null-embedding-generator';

/**
 * Elige el adaptador según SEMANTIC_SEARCH y EMBEDDING_PROVIDER. Sin
 * configuración validada (módulos de prueba) los valores llegan sin definir:
 * todo lo que no sea `on` deja la semántica desactivada.
 */
export function createEmbeddingGenerator(
  semanticSearch: 'on' | 'off' | undefined,
  provider: 'fake' | 'local' | undefined,
): EmbeddingGenerator {
  if (semanticSearch !== 'on') return new NullEmbeddingGenerator();
  if (provider !== 'local') return new FakeEmbeddingGenerator();
  throw new Error(
    'EMBEDDING_PROVIDER=local aún no está implementado; usa fake o SEMANTIC_SEARCH=off',
  );
}
