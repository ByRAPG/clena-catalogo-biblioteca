/**
 * Dimensiones de `work_embeddings.embedding` (vector(384)), fijadas por la
 * migración. Deben coincidir con las del modelo de embeddings.
 */
export const WORK_EMBEDDING_DIMENSIONS = 384;

/**
 * Valida el vector y lo serializa al literal de pgvector (`[0.1,0.2,...]`),
 * que se pasa como parámetro y se convierte con `::vector`.
 */
export function toVectorLiteral(
  vector: readonly number[],
  dimensions: number = WORK_EMBEDDING_DIMENSIONS,
): string {
  if (vector.length !== dimensions) {
    throw new Error(
      `El vector debe tener ${dimensions} dimensiones y tiene ${vector.length}`,
    );
  }
  for (const value of vector) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('El vector solo admite números finitos');
    }
  }
  return `[${vector.join(',')}]`;
}
