import { Inject, Injectable } from '@nestjs/common';
import { ImportRow } from '../../domain/entities/import-row';
import { ImportRowError } from '../../domain/errors/import-row-error';
import type {
  ICatalogImportRepository,
  SimulationRowInput,
} from '../../domain/repositories/catalog-import.repository';
import type {
  ImportCatalogReport,
  ImportRowResult,
} from '../dto/import-catalog-report';
import type { ICatalogCsvReader } from '../ports/catalog-csv-reader';
import { CATALOG_CSV_READER, CATALOG_IMPORT_REPOSITORY } from '../tokens';

@Injectable()
export class SimulateCatalogImportUseCase {
  constructor(
    @Inject(CATALOG_CSV_READER)
    private readonly csvReader: ICatalogCsvReader,
    @Inject(CATALOG_IMPORT_REPOSITORY)
    private readonly repository: ICatalogImportRepository,
  ) {}

  async execute(content: string | Uint8Array): Promise<ImportCatalogReport> {
    const failedByRow = new Map<number, ImportRowResult>();
    const validRows: SimulationRowInput[] = [];
    const rowOrder: number[] = [];

    for (const result of this.csvReader.read(content)) {
      rowOrder.push(result.row);

      if (!result.success) {
        failedByRow.set(result.row, {
          row: result.row,
          status: 'failed',
          field: result.field,
          error: result.error,
        });
        continue;
      }

      try {
        validRows.push({
          row: result.row,
          importRow: new ImportRow(result.data),
        });
      } catch (error: unknown) {
        if (!(error instanceof ImportRowError)) {
          throw error;
        }

        failedByRow.set(result.row, {
          row: result.row,
          status: 'failed',
          field: error.field,
          error: error.message,
        });
      }
    }

    const simulated =
      validRows.length > 0 ? await this.repository.simulateRows(validRows) : [];
    const simulatedByRow = new Map(
      simulated.map((item) => [item.row, item] as const),
    );

    const createdWorks = new Set<string>();
    const updatedWorks = new Set<string>();
    const report: ImportCatalogReport = {
      dryRun: true,
      created: 0,
      updated: 0,
      failed: 0,
      works: { created: 0, updated: 0 },
      copies: { created: 0, updated: 0 },
      rows: [],
    };

    for (const rowNumber of rowOrder) {
      const preFailed = failedByRow.get(rowNumber);
      if (preFailed) {
        report.failed += 1;
        report.rows.push(preFailed);
        continue;
      }

      const outcome = simulatedByRow.get(rowNumber);
      if (!outcome) continue;

      if (outcome.status === 'failed') {
        report.failed += 1;
        report.rows.push({
          row: outcome.row,
          status: 'failed',
          field: outcome.field,
          error: outcome.error,
        });
        continue;
      }

      report[outcome.status] += 1;
      report.copies[outcome.status] += 1;

      if (outcome.workOutcome === 'created') {
        createdWorks.add(outcome.workKey);
      } else if (!createdWorks.has(outcome.workKey)) {
        updatedWorks.add(outcome.workKey);
      }

      report.rows.push({
        row: outcome.row,
        status: outcome.status,
      });
    }

    report.works.created = createdWorks.size;
    report.works.updated = updatedWorks.size;

    return report;
  }
}
