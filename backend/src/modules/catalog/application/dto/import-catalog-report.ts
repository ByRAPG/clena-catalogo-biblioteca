export type ImportRowResult =
  | {
      row: number;
      status: 'created' | 'updated';
    }
  | {
      row: number;
      status: 'failed';
      field?: string;
      error: string;
    };

export interface ImportCatalogReport {
  created: number;
  updated: number;
  failed: number;
  rows: ImportRowResult[];
}
