import { EMBEDDING_DIMENSIONS } from '../domain/embedding';

/**
 * Valida el vector y lo serializa al literal de pgvector (`[0.1,0.2,...]`),
 * que se pasa como parámetro y se convierte con `::vector`. Las dimensiones
 * por defecto son las del dominio y coinciden con `vector(384)` de la migración.
 */
export function toVectorLiteral(
  vector: readonly number[],
  dimensions: number = EMBEDDING_DIMENSIONS,
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
