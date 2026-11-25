import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SEMANTIC_MODEL_STATUS } from '../../shared/application/ports/semantic-model-status';
import { Env } from '../../shared/config/env.validation';
import { SemanticModelStatus } from '../../shared/domain/health-report';
import {
  EMBEDDING_GENERATOR,
  EmbeddingGenerator,
  EmbeddingGeneratorState,
} from './application/ports/embedding-generator';
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
import {
  DEFAULT_SEARCH_RANKING_OPTIONS,
  SEARCH_RANKING_OPTIONS,
  SearchRankingOptions,
} from './application/search-ranking-options';
import { SearchWorks } from './application/search-works.use-case';
import { createEmbeddingGenerator } from './infrastructure/create-embedding-generator';
import { EmbeddingModelWarmup } from './infrastructure/embedding-model-warmup';
import { PrismaSearchRepository } from './infrastructure/prisma-search.repository';
import { PrismaWorkEmbeddingRepository } from './infrastructure/prisma-work-embedding.repository';
import { SearchController } from './presentation/search.controller';

const MODEL_STATUS: Record<EmbeddingGeneratorState, SemanticModelStatus> = {
  disabled: 'off',
  loading: 'loading',
  ready: 'ready',
  error: 'error',
};

/** Global para que `/health` (módulo shared) lea el estado del modelo. */
@Global()
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
      provide: SEARCH_RANKING_OPTIONS,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): SearchRankingOptions => ({
        minSimilarity: Number(
          config.get('SEARCH_MIN_SIMILARITY', { infer: true }) ??
            DEFAULT_SEARCH_RANKING_OPTIONS.minSimilarity,
        ),
        relativeCutoff: Number(
          config.get('SEARCH_RELATIVE_CUTOFF', { infer: true }) ??
            DEFAULT_SEARCH_RANKING_OPTIONS.relativeCutoff,
        ),
        lexicalWeight: Number(
          config.get('SEARCH_LEXICAL_WEIGHT', { infer: true }) ??
            DEFAULT_SEARCH_RANKING_OPTIONS.lexicalWeight,
        ),
      }),
    },
    { provide: SEARCH_REPOSITORY, useClass: PrismaSearchRepository },
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
          {
            modelPath: config.get('EMBEDDING_MODEL_PATH', { infer: true }),
            intraOpNumThreads: config.get('EMBEDDING_INTRA_OP_THREADS', {
              infer: true,
            }),
          },
        ),
    },
    EmbeddingModelWarmup,
    {
      provide: SEMANTIC_MODEL_STATUS,
      inject: [EMBEDDING_GENERATOR],
      useFactory: (generator: EmbeddingGenerator) => ({
        current: (): SemanticModelStatus =>
          MODEL_STATUS[generator.status().state],
      }),
    },
  ],
  exports: [ReindexWorkEmbeddings, SEMANTIC_MODEL_STATUS, EMBEDDING_GENERATOR],
})
export class SearchModule {}
