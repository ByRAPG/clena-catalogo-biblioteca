import { SemanticCutoff } from '../domain/semantic-cutoff';

export const SEARCH_RANKING_OPTIONS = Symbol('SEARCH_RANKING_OPTIONS');

export interface SearchRankingOptions extends SemanticCutoff {
  /** Peso de la lista léxica en la fusión RRF (la vectorial pesa 1). */
  lexicalWeight: number;
}

/**
 * Calibrados con multilingual-e5-small q8 sobre la semilla ficticia
 * (`pnpm search:eval`); hay que repetir la medición si cambia el modelo o el
 * texto de las obras. Con el generador falso las pruebas los fijan aparte.
 */
export const DEFAULT_SEARCH_RANKING_OPTIONS: SearchRankingOptions = {
  minSimilarity: 0.84,
  relativeCutoff: 0.04,
  lexicalWeight: 2,
};
