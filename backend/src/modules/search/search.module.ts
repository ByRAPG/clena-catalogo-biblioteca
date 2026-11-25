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
