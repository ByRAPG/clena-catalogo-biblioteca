import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EMBEDDING_GENERATOR,
  EmbeddingGenerator,
} from '../application/ports/embedding-generator';
import { ReindexWorkEmbeddings } from '../application/reindex-work-embeddings.use-case';
import { readReindexConfig } from './reindex-config';

/**
 * Dispara el reindexado al arrancar y por intervalo; no tiene lógica de
 * negocio. Así una obra nueva o importada queda indexada sin acoplar `catalog`
 * a `search`: se detecta en la siguiente pasada por su texto fuente.
 * Con SEMANTIC_SEARCH distinto de `on` no programa nada.
 */
@Injectable()
export class ReindexScheduler
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(ReindexScheduler.name);
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly reindex: ReindexWorkEmbeddings,
    private readonly config: ConfigService,
    @Inject(EMBEDDING_GENERATOR) private readonly generator: EmbeddingGenerator,
  ) {}

  onApplicationBootstrap(): void {
    const settings = readReindexConfig(this.config);
    if (!settings.enabled) return;
    // En segundo plano: no bloquea el arranque ni el health. Espera al modelo
    // para que la pasada de arranque no se omita con `not-ready`.
    void (async () => {
      await this.generator.warmUp?.();
      await this.run('arranque', settings.batchSize);
    })();
    if (settings.intervalSeconds > 0) {
      this.timer = setInterval(
        () => void this.run('intervalo', settings.batchSize),
        settings.intervalSeconds * 1000,
      );
      this.timer.unref();
    }
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  private async run(origin: string, batchSize: number): Promise<void> {
    try {
      const summary = await this.reindex.execute({ batchSize });
      if (summary.skipped === 'already-running') return;
      if (summary.processed > 0 || summary.failed > 0 || summary.skipped) {
        this.logger.log(`Reindexado (${origin}): ${JSON.stringify(summary)}`);
      }
    } catch (error) {
      this.logger.error(
        `Reindexado (${origin}) falló: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
