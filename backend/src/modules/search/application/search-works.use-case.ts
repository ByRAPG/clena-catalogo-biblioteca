import { Inject, Injectable } from '@nestjs/common';
import { WorkSummary } from '../domain/work-summary';
import { SEARCH_REPOSITORY, SearchRepository } from './ports/search.repository';
import { SearchInput, buildSearchCriteria } from './search-criteria';

export interface SearchWorksResult {
  data: WorkSummary[];
  meta: { page: number; pageSize: number; total: number };
}

@Injectable()
export class SearchWorks {
  constructor(
    @Inject(SEARCH_REPOSITORY) private readonly repository: SearchRepository,
  ) {}

  async execute(input: SearchInput): Promise<SearchWorksResult> {
    const criteria = buildSearchCriteria(input);
    const { items, total } = await this.repository.searchWorks(criteria);
    return {
      data: items,
      meta: { page: criteria.page, pageSize: criteria.pageSize, total },
    };
  }
}
