import { Module } from '@nestjs/common';
import { ReindexScheduler } from './infrastructure/reindex.scheduler';
import { SearchModule } from './search.module';

/** Programa el reindexado (arranque e intervalo); solo lo importa AppModule. */
@Module({
  imports: [SearchModule],
  providers: [ReindexScheduler],
})
export class SearchReindexModule {}
