import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../shared/config/env.validation';
import { EMBEDDING_GENERATOR } from './application/ports/embedding-generator';
import { GetWorkDetail } from './application/get-work-detail.use-case';
import { ListSearchFilters } from './application/list-search-filters.use-case';
import { SEARCH_REPOSITORY } from './application/ports/search.repository';
import { SearchWorks } from './application/search-works.use-case';
import { createEmbeddingGenerator } from './infrastructure/create-embedding-generator';
import { PrismaSearchRepository } from './infrastructure/prisma-search.repository';
import { SearchController } from './presentation/search.controller';

@Module({
  controllers: [SearchController],
  providers: [
    SearchWorks,
    GetWorkDetail,
    ListSearchFilters,
    { provide: SEARCH_REPOSITORY, useClass: PrismaSearchRepository },
    {
      provide: EMBEDDING_GENERATOR,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createEmbeddingGenerator(
          config.get('SEMANTIC_SEARCH', { infer: true }),
          config.get('EMBEDDING_PROVIDER', { infer: true }),
        ),
    },
  ],
})
export class SearchModule {}
