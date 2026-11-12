import type { ImportCatalogReport } from '../dto/import-catalog-report';

export interface SaveImportJobInput {
  fileName: string;
  userId: string;
  report: ImportCatalogReport;
}

export interface IImportJobRepository {
  save(input: SaveImportJobInput): Promise<void>;
}
