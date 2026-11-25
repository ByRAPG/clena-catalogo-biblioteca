import { Inject, Injectable } from '@nestjs/common';
import { EmbeddingVector } from '../domain/embedding';
import {
  EMBEDDING_GENERATOR,
  EmbeddingGenerator,
} from './ports/embedding-generator';
import {
  StaleWork,
  WORK_EMBEDDING_REPOSITORY,
  WorkEmbeddingRepository,
} from './ports/work-embedding.repository';

export const DEFAULT_REINDEX_BATCH_SIZE = 16;
export const DEFAULT_REINDEX_MAX_BATCHES = 50;

export interface ReindexOptions {
  /** Obras por lote (por defecto 16). */
  batchSize?: number;
  /** Tope de lotes por ejecución (por defecto 50) para no monopolizar el proceso. */
  maxBatches?: number;
}

export type ReindexSkipReason = 'disabled' | 'not-ready' | 'already-running';

export interface ReindexFailure {
  workId: string;
  message: string;
}

export interface ReindexSummary {
  /** Motivo por el que no se hizo (todo) el trabajo; ausente si terminó normalmente. */
  skipped?: ReindexSkipReason;
  model: string;
  processed: number;
  failed: number;
  /**
   * Obras que siguen obsoletas al terminar: las fallidas más, si se llegó al
   * tope de lotes, las que se vieron al sondear (cota inferior).
   */
  pending: number;
  batches: number;
  /** Verdadero si se detuvo por el tope de lotes y aún puede haber trabajo. */
  truncated: boolean;
  durationMs: number;
  failures: ReindexFailure[];
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Calcula y guarda el vector de las obras sin vector, con otro modelo o con
 * el texto fuente cambiado. Es idempotente: una obra al día no se vuelve a
 * procesar.
 *
 * Garantías de terminación: cada obra se intenta como máximo una vez por
 * ejecución (las ya intentadas se excluyen de lo que devuelve `findStale`,
 * que ordena por id y repetiría siempre las mismas fallidas), así que las
 * fallidas no bloquean a las demás ni causan bucles. Además hay un tope de
 * lotes. Solo una ejecución a la vez por instancia.
 */
@Injectable()
export class ReindexWorkEmbeddings {
  private running = false;

  constructor(
    @Inject(EMBEDDING_GENERATOR) private readonly generator: EmbeddingGenerator,
    @Inject(WORK_EMBEDDING_REPOSITORY)
    private readonly repository: WorkEmbeddingRepository,
  ) {}

  async execute(options: ReindexOptions = {}): Promise<ReindexSummary> {
    const startedAt = Date.now();
    const status = this.generator.status();
    const summary: ReindexSummary = {
      model: status.model,
      processed: 0,
      failed: 0,
      pending: 0,
      batches: 0,
      truncated: false,
      durationMs: 0,
      failures: [],
    };
    const finish = (): ReindexSummary => {
      summary.durationMs = Date.now() - startedAt;
      return summary;
    };

    const skip = (reason: ReindexSkipReason): ReindexSummary => {
      summary.skipped = reason;
      return finish();
    };

    if (this.running) return skip('already-running');
    if (status.state === 'disabled') {
      return skip('disabled');
    }
    if (status.state !== 'ready') {
      return skip('not-ready');
    }

    const batchSize = positiveInt(
      options.batchSize,
      DEFAULT_REINDEX_BATCH_SIZE,
    );
    const maxBatches = positiveInt(
      options.maxBatches,
      DEFAULT_REINDEX_MAX_BATCHES,
    );
    this.running = true;
    try {
      const attempted = new Set<string>();
      while (true) {
        if (this.generator.status().state !== 'ready') {
          summary.skipped = 'not-ready';
          break;
        }
        const batch = await this.nextBatch(status.model, batchSize, attempted);
        if (batch.length === 0) break;
        if (summary.batches >= maxBatches) {
          summary.truncated = true;
          summary.pending += batch.length;
          break;
        }
        summary.batches++;
        for (const work of batch) attempted.add(work.workId);
        await this.processBatch(batch, status.model, summary);
      }
      summary.pending += summary.failed;
    } finally {
      this.running = false;
    }
    return finish();
  }

  /**
   * Siguiente lote sin repetir obras ya intentadas: se piden `batchSize` más
   * las ya intentadas (que, por el orden por id, pueden ocupar los primeros
   * puestos) y se filtran.
   */
  private async nextBatch(
    model: string,
    batchSize: number,
    attempted: ReadonlySet<string>,
  ): Promise<StaleWork[]> {
    const stale = await this.repository.findStale(
      model,
      batchSize + attempted.size,
    );
    return stale.filter((w) => !attempted.has(w.workId)).slice(0, batchSize);
  }

  private async processBatch(
    batch: StaleWork[],
    model: string,
    summary: ReindexSummary,
  ): Promise<void> {
    let vectors: EmbeddingVector[] | null = null;
    try {
      vectors = await this.generator.embedPassages(
        batch.map((w) => w.sourceText),
      );
      if (vectors.length !== batch.length) {
        throw new Error('El generador devolvió un número de vectores distinto');
      }
    } catch {
      vectors = null;
    }
    if (vectors) {
      for (const [i, work] of batch.entries()) {
        await this.store(work, vectors[i], model, summary);
      }
      return;
    }
    // Fallo del lote: se reintenta obra por obra para aislar la culpable.
    for (const work of batch) {
      try {
        const [vector] = await this.generator.embedPassages([work.sourceText]);
        await this.store(work, vector, model, summary);
      } catch (error) {
        this.recordFailure(summary, work, error);
      }
    }
  }

  private async store(
    work: StaleWork,
    vector: EmbeddingVector,
    model: string,
    summary: ReindexSummary,
  ): Promise<void> {
    try {
      await this.repository.save(work.workId, vector, model, work.sourceHash);
      summary.processed++;
    } catch (error) {
      this.recordFailure(summary, work, error);
    }
  }

  private recordFailure(
    summary: ReindexSummary,
    work: StaleWork,
    error: unknown,
  ): void {
    summary.failed++;
    summary.failures.push({
      workId: work.workId,
      message: errorMessage(error),
    });
  }
}

function positiveInt(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isInteger(value) && value > 0
    ? value
    : fallback;
}
