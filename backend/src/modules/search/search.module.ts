import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../shared/config/env.validation';
import { EMBEDDING_GENERATOR } from './application/ports/embedding-generator';
import { GetWorkDetail } from './application/get-work-detail.use-case';
import { ListSearchFilters } from './application/list-search-filters.use-case';
import { SEARCH_REPOSITORY } from './application/ports/search.repository';
import { WORK_EMBEDDING_REPOSITORY } from './application/ports/work-embedding.repository';
import { ReindexWorkEmbeddings } from './application/reindex-work-embeddings.use-case';
import {
  DEFAULT_SEMANTIC_QUERY_OPTIONS,
  QueryEmbedder,
  SEMANTIC_QUERY_OPTIONS,
  SemanticQueryOptions,
} from './application/query-embedder';
import { SearchWorks } from './application/search-works.use-case';
import { createEmbeddingGenerator } from './infrastructure/create-embedding-generator';
import { PrismaSearchRepository } from './infrastructure/prisma-search.repository';
import { PrismaWorkEmbeddingRepository } from './infrastructure/prisma-work-embedding.repository';
import { SearchController } from './presentation/search.controller';

@Module({
  controllers: [SearchController],
  providers: [
    SearchWorks,
    GetWorkDetail,
    ListSearchFilters,
    ReindexWorkEmbeddings,
    QueryEmbedder,
    {
      provide: SEMANTIC_QUERY_OPTIONS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): SemanticQueryOptions => ({
        timeoutMs:
          config.get('SEMANTIC_TIMEOUT_MS', { infer: true }) ??
          DEFAULT_SEMANTIC_QUERY_OPTIONS.timeoutMs,
        maxConcurrent:
          config.get('SEMANTIC_MAX_CONCURRENCY', { infer: true }) ??
          DEFAULT_SEMANTIC_QUERY_OPTIONS.maxConcurrent,
        cacheSize:
          config.get('SEMANTIC_CACHE_SIZE', { infer: true }) ??
          DEFAULT_SEMANTIC_QUERY_OPTIONS.cacheSize,
        cacheTtlMs:
          (config.get('SEMANTIC_CACHE_TTL_SECONDS', { infer: true }) ??
            DEFAULT_SEMANTIC_QUERY_OPTIONS.cacheTtlMs / 1000) * 1000,
      }),
    },
    {
      provide: SEARCH_REPOSITORY,
      useClass: PrismaSearchRepository,
    },
    {
      provide: WORK_EMBEDDING_REPOSITORY,
      useClass: PrismaWorkEmbeddingRepository,
    },
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
  exports: [ReindexWorkEmbeddings],
})
export class SearchModule {}
