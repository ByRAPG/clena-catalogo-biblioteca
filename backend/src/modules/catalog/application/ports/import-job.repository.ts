import type { ImportErrorCsvEntry } from '../../domain/services/import-errors-csv.formatter';
import type { ImportCatalogReport } from '../dto/import-catalog-report';

export interface SaveImportJobInput {
  fileName: string;
  userId: string;
  report: ImportCatalogReport;
}

export interface StoredImportJob {
  id: string;
  fileName: string;
  errors: ImportErrorCsvEntry[];
}

export interface IImportJobRepository {
  save(input: SaveImportJobInput): Promise<string>;
  findById(id: string): Promise<StoredImportJob | null>;
}
