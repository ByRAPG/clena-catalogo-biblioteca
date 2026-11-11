import { Module } from '@nestjs/common';
import { GetWorkDetail } from './application/get-work-detail.use-case';
import { ListSearchFilters } from './application/list-search-filters.use-case';
import { SEARCH_REPOSITORY } from './application/ports/search.repository';
import { SearchWorks } from './application/search-works.use-case';
import { PrismaSearchRepository } from './infrastructure/prisma-search.repository';
import { SearchController } from './presentation/search.controller';

@Module({
  controllers: [SearchController],
  providers: [
    SearchWorks,
    GetWorkDetail,
    ListSearchFilters,
    { provide: SEARCH_REPOSITORY, useClass: PrismaSearchRepository },
  ],
})
export class SearchModule {}
