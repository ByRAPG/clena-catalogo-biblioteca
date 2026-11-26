import { Inject, Injectable } from '@nestjs/common';
import { ImportRow } from '../../domain/entities/import-row';
import { ImportRowError } from '../../domain/errors/import-row-error';
import type { ICatalogImportRepository } from '../../domain/repositories/catalog-import.repository';
import type { ImportCatalogReport } from '../dto/import-catalog-report';
import type {
  CsvRowResult,
  ICatalogCsvReader,
} from '../ports/catalog-csv-reader';
import type { IImportJobRepository } from '../ports/import-job.repository';

import {
  CATALOG_CSV_READER,
  CATALOG_IMPORT_REPOSITORY,
  IMPORT_JOB_REPOSITORY,
} from '../tokens';

@Injectable()
export class ImportCatalogUseCase {
  constructor(
    @Inject(CATALOG_CSV_READER)
    private readonly csvReader: ICatalogCsvReader,
    @Inject(CATALOG_IMPORT_REPOSITORY)
    private readonly repository: ICatalogImportRepository,
    @Inject(IMPORT_JOB_REPOSITORY)
    private readonly importJobs: IImportJobRepository,
  ) {}

  async execute(
    content: string | Uint8Array,
    fileName: string,
    userId: string,
  ): Promise<ImportCatalogReport> {
    const report: ImportCatalogReport = {
      dryRun: false,
      created: 0,
      updated: 0,
      failed: 0,
      works: { created: 0, updated: 0 },
      copies: { created: 0, updated: 0 },
      rows: [],
    };
    const createdWorks = new Set<string>();
    const updatedWorks = new Set<string>();

    for (const result of this.csvReader.read(content)) {
      await this.processRow(result, report, createdWorks, updatedWorks);
    }

    report.works.created = createdWorks.size;
    report.works.updated = updatedWorks.size;

    const importId = await this.importJobs.save({
      fileName,
      userId,
      report,
    });

    return { ...report, importId };
  }

  private async processRow(
    result: CsvRowResult,
    report: ImportCatalogReport,
    createdWorks: Set<string>,
    updatedWorks: Set<string>,
  ): Promise<void> {
    if (!result.success) {
      report.failed += 1;
      report.rows.push({
        row: result.row,
        status: 'failed',
        field: result.field,
        error: result.error,
      });
      return;
    }

    try {
      const row = new ImportRow(result.data);
      const outcome = await this.repository.saveRow(row);

      report[outcome.copyOutcome] += 1;
      report.copies[outcome.copyOutcome] += 1;

      if (outcome.workOutcome === 'created') {
        createdWorks.add(outcome.workKey);
      } else if (!createdWorks.has(outcome.workKey)) {
        updatedWorks.add(outcome.workKey);
      }

      report.rows.push({
        row: result.row,
        status: outcome.copyOutcome,
      });
    } catch (error: unknown) {
      if (!(error instanceof ImportRowError)) {
        throw error;
      }

      report.failed += 1;
      report.rows.push({
        row: result.row,
        status: 'failed',
        field: error.field,
        error: error.message,
      });
    }
  }
}
