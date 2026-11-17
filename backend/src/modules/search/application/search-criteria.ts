import { normalizeText } from '../../../shared/domain/normalize-text';
import { InvalidSearchCriteriaError } from '../domain/search-errors';
import { SEARCH_MODES, SearchMode, isSearchMode } from '../domain/search-mode';
import { SearchCriteria } from './ports/search.repository';

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;
export const MAX_QUERY_LENGTH = 100;
export const MAX_PAGE = 10000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface SearchInput {
  q?: string;
  categoryId?: string;
  roomId?: string;
  available?: boolean;
  page?: number;
  pageSize?: number;
  mode?: string;
}

function optionalUuid(value: string | undefined, name: string): string | null {
  if (value === undefined) return null;
  if (!UUID.test(value)) {
    throw new InvalidSearchCriteriaError(`${name} debe ser un UUID`);
  }
  return value;
}

/** Valida y normaliza los parámetros de búsqueda como un objeto simple. */
export function buildSearchCriteria(input: SearchInput): SearchCriteria {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
    throw new InvalidSearchCriteriaError(
      `page debe estar entre 1 y ${MAX_PAGE}`,
    );
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new InvalidSearchCriteriaError(
      `pageSize debe estar entre 1 y ${MAX_PAGE_SIZE}`,
    );
  }
  if ((input.q ?? '').length > MAX_QUERY_LENGTH) {
    throw new InvalidSearchCriteriaError(
      `q no puede superar ${MAX_QUERY_LENGTH} caracteres`,
    );
  }
  if (input.mode !== undefined && !isSearchMode(input.mode)) {
    throw new InvalidSearchCriteriaError(
      `mode debe ser uno de: ${SEARCH_MODES.join(', ')}`,
    );
  }
  const mode: SearchMode | null = input.mode ?? null;
  const normalized = normalizeText(input.q ?? '');
  return {
    query: normalized === '' ? null : normalized,
    categoryId: optionalUuid(input.categoryId, 'categoryId'),
    roomId: optionalUuid(input.roomId, 'roomId'),
    onlyAvailable: input.available === true,
    page,
    pageSize,
    mode,
  };
}
