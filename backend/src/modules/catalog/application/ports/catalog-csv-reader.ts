import type { ImportRowInput } from '../../domain/entities/import-row';

export type CsvRowResult =
  | {
      row: number;
      success: true;
      data: ImportRowInput;
    }
  | {
      row: number;
      success: false;
      field?: string;
      error: string;
    };

export interface ICatalogCsvReader {
  read(content: string): CsvRowResult[];
}
