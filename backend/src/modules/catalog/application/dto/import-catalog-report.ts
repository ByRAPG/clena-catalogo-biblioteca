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

export interface ImportEntitySummary {
  created: number;
  updated: number;
}

export interface ImportCatalogReport {
  importId?: string;
  dryRun: boolean;
  created: number;
  updated: number;
  failed: number;
  works: ImportEntitySummary;
  copies: ImportEntitySummary;
  rows: ImportRowResult[];
}
