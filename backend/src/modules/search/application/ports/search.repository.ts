import {
  CategoryRef,
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
}

export interface SearchPage {
  items: WorkSummary[];
  total: number;
}

export interface SearchRepository {
  searchWorks(criteria: SearchCriteria): Promise<SearchPage>;
  findWorkDetail(id: string): Promise<WorkDetail | null>;
  listCategories(): Promise<CategoryRef[]>;
  listRooms(): Promise<CategoryRef[]>;
}
