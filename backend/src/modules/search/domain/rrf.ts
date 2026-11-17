/** Constante de Reciprocal Rank Fusion del ADR-08. */
export const RRF_K = 60;

export interface FusedItem {
  id: string;
  /** Suma de 1 / (k + posición) sobre las listas donde aparece (posición desde 1). */
  score: number;
}

/**
 * Reciprocal Rank Fusion: combina listas de ids ordenadas de mejor a peor.
 * Un id repetido dentro de una misma lista cuenta solo en su primera posición.
 * Desempate determinista: mayor puntuación, luego mejor posición en alguna
 * lista y, por último, id ascendente. `weights` (opcional, uno por lista;
 * 1 si falta) multiplica la contribución de cada lista.
 */
export function fuseRrf(
  rankings: readonly (readonly string[])[],
  k: number = RRF_K,
  weights: readonly number[] = [],
): FusedItem[] {
  const acc = new Map<string, { score: number; best: number }>();
  rankings.forEach((ranking, listIndex) => {
    const weight = weights[listIndex] ?? 1;
    const seen = new Set<string>();
    ranking.forEach((id, index) => {
      if (seen.has(id)) return;
      seen.add(id);
      const rank = index + 1;
      const entry = acc.get(id) ?? { score: 0, best: Number.POSITIVE_INFINITY };
      entry.score += weight / (k + rank);
      entry.best = Math.min(entry.best, rank);
      acc.set(id, entry);
    });
  });
  return [...acc.entries()]
    .sort(
      ([idA, a], [idB, b]) =>
        b.score - a.score ||
        a.best - b.best ||
        (idA < idB ? -1 : idA > idB ? 1 : 0),
    )
    .map(([id, { score }]) => ({ id, score }));
}
