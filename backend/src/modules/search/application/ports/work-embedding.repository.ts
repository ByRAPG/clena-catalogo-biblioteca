export const WORK_EMBEDDING_REPOSITORY = Symbol('WORK_EMBEDDING_REPOSITORY');

/** Obra cuyo vector falta o está desactualizado, con su texto fuente actual. */
export interface StaleWork {
  workId: string;
  /** Texto del que se genera el embedding (título, autores, temas, categoría). */
  sourceText: string;
  /** SHA-256 (hex) de `sourceText`; es el que se guarda al llamar a `save`. */
  sourceHash: string;
}

export interface NearestWork {
  workId: string;
  /** Similitud coseno (1 - distancia `<=>`): mayor es más cercano. */
  score: number;
}

/** Mismos filtros de la búsqueda textual; todos opcionales. */
export interface NearestFilters {
  categoryId?: string | null;
  roomId?: string | null;
  onlyAvailable?: boolean;
}

export interface WorkEmbeddingRepository {
  /**
   * Obras vigentes (no borradas) sin vector, con otro `model` o cuyo texto
   * fuente ya no coincide con el hash guardado. Orden estable por id.
   */
  findStale(model: string, limit: number): Promise<StaleWork[]>;

  /** Inserta o reemplaza el vector de la obra. */
  save(
    workId: string,
    vector: readonly number[],
    model: string,
    sourceHash: string,
  ): Promise<void>;

  /** Vecinos más cercanos por distancia coseno (búsqueda exacta). */
  searchNearest(
    queryVector: readonly number[],
    limit: number,
    filters?: NearestFilters,
  ): Promise<NearestWork[]>;
}
