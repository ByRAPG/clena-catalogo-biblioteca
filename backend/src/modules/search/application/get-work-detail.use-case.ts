import { Inject, Injectable } from '@nestjs/common';
import { WorkNotFoundError } from '../domain/search-errors';
import { WorkDetail } from '../domain/work-summary';
import { SEARCH_REPOSITORY, SearchRepository } from './ports/search.repository';

@Injectable()
export class GetWorkDetail {
  constructor(
    @Inject(SEARCH_REPOSITORY) private readonly repository: SearchRepository,
  ) {}

  async execute(id: string): Promise<WorkDetail> {
    const detail = await this.repository.findWorkDetail(id);
    if (!detail) throw new WorkNotFoundError(id);
    return detail;
  }
}
