import { EmbeddingGenerator } from '../application/ports/embedding-generator';
import { FakeEmbeddingGenerator } from './fake-embedding-generator';
import {
  LocalEmbeddingGenerator,
  LocalEmbeddingOptions,
} from './local-embedding-generator';
import { NullEmbeddingGenerator } from './null-embedding-generator';

/**
 * Elige el adaptador según SEMANTIC_SEARCH y EMBEDDING_PROVIDER. Sin
 * configuración validada (módulos de prueba) los valores llegan sin definir:
 * todo lo que no sea `on` deja la semántica desactivada. `local` no carga el
 * modelo aquí: lo hace `warmUp()` en segundo plano.
 */
export function createEmbeddingGenerator(
  semanticSearch: 'on' | 'off' | undefined,
  provider: 'fake' | 'local' | undefined,
  local?: LocalEmbeddingOptions,
): EmbeddingGenerator {
  if (semanticSearch !== 'on') return new NullEmbeddingGenerator();
  if (provider !== 'local') return new FakeEmbeddingGenerator();
  if (!local) {
    throw new Error('EMBEDDING_PROVIDER=local requiere EMBEDDING_MODEL_PATH');
  }
  return new LocalEmbeddingGenerator(local);
}
