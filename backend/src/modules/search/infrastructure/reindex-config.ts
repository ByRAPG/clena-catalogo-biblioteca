import { ConfigService } from '@nestjs/config';
import { DEFAULT_REINDEX_BATCH_SIZE } from '../application/reindex-work-embeddings.use-case';

export interface ReindexConfig {
  enabled: boolean;
  intervalSeconds: number;
  batchSize: number;
}

const toNumber = (value: unknown, fallback: number): number => {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Lee la configuración de reindexado. Sin configuración validada (módulos de
 * prueba) los valores llegan sin definir o como texto: `enabled` solo es
 * verdadero con SEMANTIC_SEARCH=on y el intervalo no definido cuenta como 0.
 */
export function readReindexConfig(config: ConfigService): ReindexConfig {
  return {
    enabled: config.get('SEMANTIC_SEARCH') === 'on',
    intervalSeconds: Math.max(
      0,
      toNumber(config.get('SEMANTIC_REINDEX_INTERVAL_SECONDS'), 0),
    ),
    batchSize: toNumber(
      config.get('SEMANTIC_REINDEX_BATCH_SIZE'),
      DEFAULT_REINDEX_BATCH_SIZE,
    ),
  };
}
