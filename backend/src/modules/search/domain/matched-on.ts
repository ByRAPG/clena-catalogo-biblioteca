import { MatchedOn } from './work-summary';

/** Puntuaciones ponderadas por origen; null si ese origen no coincidió. */
export interface MatchScores {
  title: number | null;
  author: number | null;
  subject: number | null;
}

const ORDER: MatchedOn[] = ['title', 'author', 'subject'];

/**
 * Origen de la coincidencia de una obra: el de mayor puntuación. En empate
 * gana título, luego autor, luego tema. Sin ninguna coincidencia devuelve null.
 */
export function resolveMatchedOn(scores: MatchScores): MatchedOn | null {
  let best: MatchedOn | null = null;
  let bestScore = -Infinity;
  for (const origin of ORDER) {
    const score = scores[origin];
    if (score !== null && score > bestScore) {
      best = origin;
      bestScore = score;
    }
  }
  return best;
}
