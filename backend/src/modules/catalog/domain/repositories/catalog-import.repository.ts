import type { ImportRow } from '../entities/import-row';

export type ImportRowOutcome = 'created' | 'updated';

export interface ICatalogImportRepository {
  saveRow(row: ImportRow): Promise<ImportRowOutcome>;
}
