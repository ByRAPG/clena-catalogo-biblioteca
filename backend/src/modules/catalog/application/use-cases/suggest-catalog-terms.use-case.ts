import { Inject, Injectable } from '@nestjs/common';
import { normalizeText } from '../../../../shared/domain/normalize-text';
import {
  CATALOG_TERM_REPOSITORY,
  type CatalogTerm,
  type CatalogTermKind,
  type CatalogTermRepository,
} from '../ports/catalog-term.repository';

export const MIN_SUGGESTION_LENGTH = 2;
export const SUGGESTION_LIMIT = 8;

/**
 * HU-10: sugiere autores o temas que ya existen mientras el personal escribe,
 * para elegir el existente en lugar de crear un duplicado.
 */
@Injectable()
export class SuggestCatalogTermsUseCase {
  constructor(
    @Inject(CATALOG_TERM_REPOSITORY)
    private readonly terms: CatalogTermRepository,
  ) {}

  async execute(kind: CatalogTermKind, query: string): Promise<CatalogTerm[]> {
    const normalized = normalizeText(query);
    if (normalized.length < MIN_SUGGESTION_LENGTH) return [];
    return this.terms.suggest(kind, normalized, SUGGESTION_LIMIT);
  }
}
