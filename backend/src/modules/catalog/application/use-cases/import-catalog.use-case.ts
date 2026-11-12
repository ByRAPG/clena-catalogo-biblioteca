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
    content: string,
    fileName: string,
    userId: string,
  ): Promise<ImportCatalogReport> {
    const report: ImportCatalogReport = {
      created: 0,
      updated: 0,
      failed: 0,
      rows: [],
    };

    for (const result of this.csvReader.read(content)) {
      await this.processRow(result, report);
    }

    await this.importJobs.save({
      fileName,
      userId,
      report,
    });

    return report;
  }

  private async processRow(
    result: CsvRowResult,
    report: ImportCatalogReport,
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

      report[outcome] += 1;
      report.rows.push({
        row: result.row,
        status: outcome,
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
