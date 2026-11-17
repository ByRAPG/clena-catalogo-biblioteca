/** Modos de búsqueda que puede pedir quien consulta (ADR-08). */
export const SEARCH_MODES = ['hybrid', 'lexical', 'semantic'] as const;

export type SearchMode = (typeof SEARCH_MODES)[number];

export function isSearchMode(value: unknown): value is SearchMode {
  return (SEARCH_MODES as readonly unknown[]).includes(value);
}
