import type { ImportRow } from '../entities/import-row';

export type ImportRowOutcome = 'created' | 'updated';

export interface SaveImportRowResult {
  workKey: string;
  workOutcome: ImportRowOutcome;
  copyOutcome: ImportRowOutcome;
}

export interface SimulationRowInput {
  row: number;
  importRow: ImportRow;
}

export type SimulatedRowResult =
  | {
      row: number;
      status: ImportRowOutcome;
      workKey: string;
      workOutcome: ImportRowOutcome;
    }
  | {
      row: number;
      status: 'failed';
      field?: string;
      error: string;
    };

export interface ICatalogImportRepository {
  saveRow(row: ImportRow): Promise<SaveImportRowResult>;
  simulateRows(
    rows: readonly SimulationRowInput[],
  ): Promise<SimulatedRowResult[]>;
}
