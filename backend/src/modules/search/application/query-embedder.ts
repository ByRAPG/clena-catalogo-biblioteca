import { Inject, Injectable, Logger } from '@nestjs/common';
import { EmbeddingVector } from '../domain/embedding';
import { ConcurrencyLimiter } from './concurrency-limiter';
import { LruCache } from './lru-cache';
import {
  EMBEDDING_GENERATOR,
  EmbeddingGenerator,
} from './ports/embedding-generator';

export const SEMANTIC_QUERY_OPTIONS = Symbol('SEMANTIC_QUERY_OPTIONS');

export interface SemanticQueryOptions {
  /** Tiempo máximo para obtener el vector de la consulta. */
  timeoutMs: number;
  /** Inferencias simultáneas permitidas; las demás degradan. */
  maxConcurrent: number;
  cacheSize: number;
  cacheTtlMs: number;
}

export const DEFAULT_SEMANTIC_QUERY_OPTIONS: SemanticQueryOptions = {
  timeoutMs: 800,
  maxConcurrent: 2,
  cacheSize: 500,
  cacheTtlMs: 600_000,
};

class TimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Obtiene el vector de una consulta con tres protecciones: caché LRU por
 * texto normalizado, límite de inferencias simultáneas (sin cola) y tiempo
 * máximo. Nunca lanza: devuelve `null` cuando hay que degradar a léxica.
 */
@Injectable()
export class QueryEmbedder {
  private readonly logger = new Logger(QueryEmbedder.name);
  private readonly cache: LruCache<EmbeddingVector>;
  private readonly limiter: ConcurrencyLimiter;
  private readonly options: SemanticQueryOptions;

  constructor(
    @Inject(EMBEDDING_GENERATOR) private readonly generator: EmbeddingGenerator,
    @Inject(SEMANTIC_QUERY_OPTIONS) options: SemanticQueryOptions,
  ) {
    this.options = options;
    this.cache = new LruCache(options.cacheSize, options.cacheTtlMs);
    this.limiter = new ConcurrencyLimiter(options.maxConcurrent);
  }

  /** La búsqueda semántica está encendida (no es el adaptador nulo). */
  get enabled(): boolean {
    return this.generator.status().state !== 'disabled';
  }

  /** El texto de la consulta (espacios colapsados) sirve de clave de caché. */
  async embed(normalizedQuery: string): Promise<EmbeddingVector | null> {
    if (this.generator.status().state !== 'ready') {
      this.logger.warn('Modelo de embeddings no listo; se responde con léxica');
      return null;
    }
    const cached = this.cache.get(normalizedQuery);
    if (cached) return cached;

    const release = this.limiter.tryAcquire();
    if (!release) {
      this.logger.warn('Límite de inferencias simultáneas; se degrada');
      return null;
    }
    // El cupo se libera cuando termina la inferencia real, aunque se haya
    // agotado el tiempo de espera, para no sobrepasar el límite de CPU.
    // El vector se guarda en caché aunque llegue tarde: la consulta repetida
    // ya no vuelve a degradar.
    const inference = Promise.resolve()
      .then(() => this.generator.embedQuery(normalizedQuery))
      .then((vector) => {
        this.cache.set(normalizedQuery, vector);
        return vector;
      })
      .finally(release);
    try {
      return await withTimeout(inference, this.options.timeoutMs);
    } catch (error) {
      const reason =
        error instanceof TimeoutError
          ? `supera ${this.options.timeoutMs} ms`
          : 'falló el generador';
      this.logger.warn(`Embedding de la consulta no disponible: ${reason}`);
      return null;
    }
  }
}
