import { Inject, Injectable } from '@nestjs/common';
import { ImportJobNotFoundError } from '../../domain/errors/import-job-not-found.error';
import {
  formatImportErrorsCsv,
  type ImportErrorCsvEntry,
} from '../../domain/services/import-errors-csv.formatter';
import type { IImportJobRepository } from '../ports/import-job.repository';
import { IMPORT_JOB_REPOSITORY } from '../tokens';
import { SimulateCatalogImportUseCase } from './simulate-catalog-import.use-case';

export interface ImportErrorsCsvReport {
  fileName: string;
  csv: string;
}

@Injectable()
export class GetImportErrorsCsvUseCase {
  constructor(
    @Inject(IMPORT_JOB_REPOSITORY)
    private readonly importJobs: IImportJobRepository,
    private readonly simulateImport: SimulateCatalogImportUseCase,
  ) {}

  async fromImportJob(importId: string): Promise<ImportErrorsCsvReport> {
    const job = await this.importJobs.findById(importId);
    if (!job) {
      throw new ImportJobNotFoundError(importId);
    }

    return {
      fileName: `errores-importacion-${job.id}.csv`,
      csv: formatImportErrorsCsv(job.errors),
    };
  }

  async fromSimulation(
    content: string | Uint8Array,
  ): Promise<ImportErrorsCsvReport> {
    const report = await this.simulateImport.execute(content);
    const errors: ImportErrorCsvEntry[] = report.rows
      .filter((row) => row.status === 'failed')
      .map((row) => ({
        row: row.row,
        ...(row.field ? { field: row.field } : {}),
        error: row.error,
      }));

    return {
      fileName: 'errores-simulacion.csv',
      csv: formatImportErrorsCsv(errors),
    };
  }
}
