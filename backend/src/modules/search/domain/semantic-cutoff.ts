export interface SemanticCutoff {
  /** Similitud coseno mínima absoluta; por debajo no hay coincidencia. */
  minSimilarity: number;
  /** Máxima distancia permitida respecto al mejor resultado (1 = sin corte relativo). */
  relativeCutoff: number;
}

/**
 * Conserva solo los vecinos realmente cercanos: similitud >= `minSimilarity` y
 * a no más de `relativeCutoff` del mejor. Con e5 las similitudes de textos sin
 * relación también son altas (0,75+), por eso el mínimo se calibra midiendo
 * (`pnpm search:eval`) y se fija por modelo. Recibe la lista de mejor a peor.
 */
export function cutOffSemantic<T extends { score: number }>(
  hits: readonly T[],
  { minSimilarity, relativeCutoff }: SemanticCutoff,
): T[] {
  if (hits.length === 0) return [];
  const floor = Math.max(minSimilarity, hits[0].score - relativeCutoff);
  return hits.filter((hit) => hit.score >= floor);
}
