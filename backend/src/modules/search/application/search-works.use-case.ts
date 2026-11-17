import { Inject, Injectable } from '@nestjs/common';
import { fuseRrf } from '../domain/rrf';
import { SearchMode } from '../domain/search-mode';
import { WorkSummary } from '../domain/work-summary';
import { QueryEmbedder } from './query-embedder';
import {
  LexicalHit,
  SEARCH_REPOSITORY,
  SearchCriteria,
  SearchRepository,
} from './ports/search.repository';
import {
  NearestWork,
  WORK_EMBEDDING_REPOSITORY,
  WorkEmbeddingRepository,
} from './ports/work-embedding.repository';
import { SearchInput, buildSearchCriteria } from './search-criteria';

/** Candidatos que aporta cada ranking a la fusión (ADR-08). */
export const CANDIDATES_PER_RANKING = 100;

export interface SearchWorksResult {
  data: WorkSummary[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    /** Modo realmente aplicado. */
    mode: SearchMode;
    /** Se pidió semántica o híbrida y se respondió solo con la léxica. */
    degraded: boolean;
  };
}

@Injectable()
export class SearchWorks {
  constructor(
    @Inject(SEARCH_REPOSITORY) private readonly repository: SearchRepository,
    @Inject(WORK_EMBEDDING_REPOSITORY)
    private readonly embeddings: WorkEmbeddingRepository,
    private readonly queryEmbedder: QueryEmbedder,
  ) {}

  async execute(input: SearchInput): Promise<SearchWorksResult> {
    const criteria = buildSearchCriteria(input);
    const semanticOn = this.queryEmbedder.enabled;
    const requested: SearchMode =
      criteria.mode ?? (semanticOn ? 'hybrid' : 'lexical');

    // Sin texto no hay nada que comparar: se conserva el comportamiento actual.
    if (requested === 'lexical' || criteria.query === null) {
      return this.lexical(criteria, false);
    }

    const vector = semanticOn
      ? await this.queryEmbedder.embed(criteria.query)
      : null;
    const semanticHits = vector
      ? await this.nearest(vector, criteria).catch(() => null)
      : null;
    if (semanticHits === null) return this.lexical(criteria, true);

    const semanticIds = semanticHits.map((h) => h.workId);
    let hits: LexicalHit[];
    if (requested === 'semantic') {
      hits = semanticIds.map((id) => ({ id, matchedOn: null }));
    } else {
      const lexicalHits = await this.repository.rankLexical(
        criteria,
        CANDIDATES_PER_RANKING,
      );
      const matched = new Map(lexicalHits.map((h) => [h.id, h.matchedOn]));
      hits = fuseRrf([lexicalHits.map((h) => h.id), semanticIds]).map(
        ({ id }) => ({ id, matchedOn: matched.get(id) ?? null }),
      );
    }

    const offset = (criteria.page - 1) * criteria.pageSize;
    const data = await this.repository.findSummaries(
      hits.slice(offset, offset + criteria.pageSize),
    );
    return {
      data,
      meta: {
        page: criteria.page,
        pageSize: criteria.pageSize,
        total: hits.length,
        mode: requested,
        degraded: false,
      },
    };
  }

  private nearest(
    vector: number[],
    criteria: SearchCriteria,
  ): Promise<NearestWork[]> {
    return this.embeddings.searchNearest(vector, CANDIDATES_PER_RANKING, {
      categoryId: criteria.categoryId,
      roomId: criteria.roomId,
      onlyAvailable: criteria.onlyAvailable,
    });
  }

  private async lexical(
    criteria: SearchCriteria,
    degraded: boolean,
  ): Promise<SearchWorksResult> {
    const { items, total } = await this.repository.searchWorks(criteria);
    return {
      data: items,
      meta: {
        page: criteria.page,
        pageSize: criteria.pageSize,
        total,
        mode: 'lexical',
        degraded,
      },
    };
  }
}
