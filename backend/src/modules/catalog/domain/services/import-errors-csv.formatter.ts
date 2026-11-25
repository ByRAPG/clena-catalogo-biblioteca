export interface ImportErrorCsvEntry {
  row: number;
  field?: string;
  error: string;
}

const CSV_HEADER = 'fila,campo,error';
const FORMULA_PREFIX = /^[\t\r ]*[=+\-@]/;

function sanitizeFormula(value: string): string {
  return FORMULA_PREFIX.test(value) ? `'${value}` : value;
}

function escapeCsvCell(value: string): string {
  const safeValue = sanitizeFormula(value);
  if (/[",\r\n]/.test(safeValue)) {
    return `"${safeValue.replaceAll('"', '""')}"`;
  }
  return safeValue;
}

export function formatImportErrorsCsv(
  entries: readonly ImportErrorCsvEntry[],
): string {
  const lines = [CSV_HEADER];

  for (const entry of entries) {
    lines.push(
      [
        String(entry.row),
        escapeCsvCell(entry.field ?? ''),
        escapeCsvCell(entry.error),
      ].join(','),
    );
  }

  return `${lines.join('\n')}\n`;
}
