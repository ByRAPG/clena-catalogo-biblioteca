import { Inject, Injectable } from '@nestjs/common';
import { CategoryRef } from '../domain/work-summary';
import { SEARCH_REPOSITORY, SearchRepository } from './ports/search.repository';

@Injectable()
export class ListSearchFilters {
  constructor(
    @Inject(SEARCH_REPOSITORY) private readonly repository: SearchRepository,
  ) {}

  categories(): Promise<CategoryRef[]> {
    return this.repository.listCategories();
  }

  rooms(): Promise<CategoryRef[]> {
    return this.repository.listRooms();
  }
}
