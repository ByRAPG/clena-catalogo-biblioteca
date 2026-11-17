import { SearchMode } from '../../domain/search-mode';
import {
  CategoryRef,
  MatchedOn,
  WorkDetail,
  WorkSummary,
} from '../../domain/work-summary';

export const SEARCH_REPOSITORY = Symbol('SEARCH_REPOSITORY');

/** Criterios ya validados y normalizados. */
export interface SearchCriteria {
  /** Texto normalizado con normalizeText; null si no hay término. */
  query: string | null;
  categoryId: string | null;
  roomId: string | null;
  onlyAvailable: boolean;
  page: number;
  pageSize: number;
  /** Modo pedido; null si no se indicó (el caso de uso elige el defecto). */
  mode: SearchMode | null;
}

export interface SearchPage {
  items: WorkSummary[];
  total: number;
}

/** Obra del ranking léxico, con el campo donde coincidió el texto. */
export interface LexicalHit {
  id: string;
  matchedOn: MatchedOn | null;
}

export interface SearchRepository {
  searchWorks(criteria: SearchCriteria): Promise<SearchPage>;
  /**
   * Ranking léxico (mejor primero) de hasta `limit` obras con texto y filtros;
   * `criteria.query` no puede ser null. Se ignoran `page` y `pageSize`.
   */
  rankLexical(criteria: SearchCriteria, limit: number): Promise<LexicalHit[]>;
  /** Resúmenes en el mismo orden de `hits`; omite obras que ya no existen. */
  findSummaries(hits: readonly LexicalHit[]): Promise<WorkSummary[]>;
  findWorkDetail(id: string): Promise<WorkDetail | null>;
  listCategories(): Promise<CategoryRef[]>;
  listRooms(): Promise<CategoryRef[]>;
}
