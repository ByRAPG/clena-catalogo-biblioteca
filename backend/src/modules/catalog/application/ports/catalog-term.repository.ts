export const CATALOG_TERM_REPOSITORY = Symbol('CATALOG_TERM_REPOSITORY');

export type CatalogTermKind = 'authors' | 'subjects';

export interface CatalogTerm {
  id: string;
  name: string;
}

export interface CatalogTermRepository {
  /** Autores o temas cuyo nombre normalizado contiene `normalizedQuery`. */
  suggest(
    kind: CatalogTermKind,
    normalizedQuery: string,
    limit: number,
  ): Promise<CatalogTerm[]>;
}
