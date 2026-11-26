import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { normalizeText } from '../../../../shared/domain/normalize-text';
import type {
  CsvRowResult,
  ICatalogCsvReader,
} from '../../application/ports/catalog-csv-reader';
import type {
  ImportedCopyStatus,
  ImportRowInput,
} from '../../domain/entities/import-row';
import { ImportRowError } from '../../domain/errors/import-row-error';
import { InvalidCsvError } from '../../domain/errors/invalid-csv.error';
import { CSV_IMPORT_LIMITS } from '../../domain/value-objects/csv-limits';
import { decodeCsvContent } from './csv-encoding';

interface ParsedRecord {
  record: string[];
  info: {
    lines: number;
  };
}

type CanonicalHeader =
  | 'titulo'
  | 'autor'
  | 'tema'
  | 'isbn'
  | 'clasificacion'
  | 'anio'
  | 'editorial'
  | 'categoria'
  | 'sala'
  | 'seccion'
  | 'estante'
  | 'codigo_ejemplar'
  | 'estado'
  | 'url_digital';

const REQUIRED_HEADERS: readonly CanonicalHeader[] = [
  'titulo',
  'sala',
  'seccion',
  'estante',
  'codigo_ejemplar',
];

const HEADER_ALIASES: Record<string, CanonicalHeader> = {
  titulo: 'titulo',
  title: 'titulo',
  nombre: 'titulo',
  obra: 'titulo',
  titulo_obra: 'titulo',
  nombre_obra: 'titulo',
  autor: 'autor',
  autores: 'autor',
  author: 'autor',
  authors: 'autor',
  tema: 'tema',
  temas: 'tema',
  subject: 'tema',
  subjects: 'tema',
  materia: 'tema',
  materias: 'tema',
  isbn: 'isbn',
  isbn10: 'isbn',
  isbn13: 'isbn',
  isbn_10: 'isbn',
  isbn_13: 'isbn',
  clasificacion: 'clasificacion',
  classification: 'clasificacion',
  dewey: 'clasificacion',
  cdu: 'clasificacion',
  signatura: 'clasificacion',
  anio: 'anio',
  ano: 'anio',
  year: 'anio',
  fecha: 'anio',
  anio_publicacion: 'anio',
  ano_publicacion: 'anio',
  editorial: 'editorial',
  publisher: 'editorial',
  categoria: 'categoria',
  category: 'categoria',
  coleccion: 'categoria',
  sala: 'sala',
  room: 'sala',
  seccion: 'seccion',
  section: 'seccion',
  estante: 'estante',
  shelf: 'estante',
  ubicacion: 'estante',
  codigo_ejemplar: 'codigo_ejemplar',
  codigo_de_ejemplar: 'codigo_ejemplar',
  codigo: 'codigo_ejemplar',
  codigo_inventario: 'codigo_ejemplar',
  codigo_de_inventario: 'codigo_ejemplar',
  inventario: 'codigo_ejemplar',
  inventory_code: 'codigo_ejemplar',
  barcode: 'codigo_ejemplar',
  ejemplar: 'codigo_ejemplar',
  estado: 'estado',
  status: 'estado',
  disponibilidad: 'estado',
  url_digital: 'url_digital',
  url: 'url_digital',
  digital_url: 'url_digital',
  enlace: 'url_digital',
  enlace_digital: 'url_digital',
  link: 'url_digital',
};

const CANDIDATE_DELIMITERS = [',', ';', '\t'] as const;

@Injectable()
export class CatalogCsvReader implements ICatalogCsvReader {
  read(content: string | Uint8Array): CsvRowResult[] {
    const decoded = decodeCsvContent(content);
    const delimiter = this.detectDelimiter(decoded);
    const records = this.parseRecords(decoded, delimiter);
    const header = records.shift();

    if (!header) {
      throw new InvalidCsvError('El archivo CSV está vacío');
    }

    const canonicalHeaders = this.resolveHeaders(header.record);

    if (records.length > CSV_IMPORT_LIMITS.maxRows) {
      throw new InvalidCsvError(
        `El archivo supera el máximo permitido de ${CSV_IMPORT_LIMITS.maxRows} filas por importación`,
      );
    }

    return records.map((entry) => this.convertRow(canonicalHeaders, entry));
  }

  private detectDelimiter(content: string): string {
    const firstLine = content
      .split(/\r?\n/)
      .find((line) => line.trim().length > 0);

    if (!firstLine) {
      throw new InvalidCsvError('El archivo CSV está vacío');
    }

    let bestDelimiter: string = ',';
    let bestMatches = -1;
    let bestCount = -1;

    for (const candidate of CANDIDATE_DELIMITERS) {
      const cells = this.splitHeaderLine(firstLine, candidate);
      const count = cells.length - 1;
      if (count <= 0) continue;

      const matches = cells.filter(
        (cell) => HEADER_ALIASES[this.normalizeHeaderKey(cell)] !== undefined,
      ).length;

      if (
        matches > bestMatches ||
        (matches === bestMatches && count > bestCount)
      ) {
        bestDelimiter = candidate;
        bestMatches = matches;
        bestCount = count;
      }
    }

    return bestDelimiter;
  }

  private splitHeaderLine(line: string, delimiter: string): string[] {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    cells.push(current.trim());
    return cells;
  }

  private parseRecords(content: string, delimiter: string): ParsedRecord[] {
    let records: unknown;

    try {
      records = parse(content, {
        bom: true,
        delimiter,
        trim: true,
        skip_empty_lines: true,
        relax_column_count: true,
        info: true,
      });
    } catch {
      throw new InvalidCsvError(
        'No se pudo interpretar el CSV. Revise las comillas y el formato',
      );
    }

    if (!Array.isArray(records)) {
      throw new InvalidCsvError('El lector no devolvió registros válidos');
    }

    return records.map((record: unknown) => {
      if (!this.isParsedRecord(record)) {
        throw new InvalidCsvError('El lector devolvió un registro inválido');
      }

      return record;
    });
  }

  private isParsedRecord(value: unknown): value is ParsedRecord {
    if (
      typeof value !== 'object' ||
      value === null ||
      !('record' in value) ||
      !('info' in value)
    ) {
      return false;
    }

    return (
      Array.isArray(value.record) &&
      value.record.every((cell: unknown) => typeof cell === 'string') &&
      typeof value.info === 'object' &&
      value.info !== null &&
      'lines' in value.info &&
      typeof value.info.lines === 'number' &&
      Number.isSafeInteger(value.info.lines) &&
      value.info.lines > 0
    );
  }

  private normalizeHeaderKey(raw: string): string {
    return normalizeText(raw).replace(/[\s-]+/g, '_');
  }

  private resolveHeaders(rawHeaders: string[]): CanonicalHeader[] {
    const resolved: CanonicalHeader[] = [];
    const seen = new Set<CanonicalHeader>();

    for (const raw of rawHeaders) {
      const canonical = HEADER_ALIASES[this.normalizeHeaderKey(raw)];
      if (!canonical) {
        throw new InvalidCsvError(
          `La cabecera «${raw}» no coincide con ninguna columna reconocida de la plantilla`,
        );
      }

      if (seen.has(canonical)) {
        throw new InvalidCsvError(
          `La columna «${canonical}» está repetida en la cabecera`,
        );
      }

      seen.add(canonical);
      resolved.push(canonical);
    }

    const missing = REQUIRED_HEADERS.filter((header) => !seen.has(header));
    if (missing.length > 0) {
      throw new InvalidCsvError(
        `Faltan columnas obligatorias en la cabecera: ${missing.join(', ')}`,
      );
    }

    return resolved;
  }

  private convertRow(
    headers: CanonicalHeader[],
    entry: ParsedRecord,
  ): CsvRowResult {
    const row = entry.info.lines;

    if (entry.record.length !== headers.length) {
      return {
        row,
        success: false,
        error: 'La cantidad de columnas no coincide con la cabecera',
      };
    }

    const values: Partial<Record<CanonicalHeader, string>> = Object.fromEntries(
      headers.map((header, index) => [header, entry.record[index]]),
    );

    try {
      return {
        row,
        success: true,
        data: this.toInput(values),
      };
    } catch (error: unknown) {
      if (!(error instanceof ImportRowError)) {
        throw error;
      }

      return {
        row,
        success: false,
        field: error.field,
        error: error.message,
      };
    }
  }

  private toInput(
    values: Partial<Record<CanonicalHeader, string>>,
  ): ImportRowInput {
    return {
      title: values.titulo ?? '',
      authors: this.splitList(values.autor ?? ''),
      subjects: this.splitList(values.tema ?? ''),
      isbn: values.isbn || undefined,
      classification: values.clasificacion || undefined,
      year: this.parseYear(values.anio ?? ''),
      publisher: values.editorial || undefined,
      category: values.categoria || undefined,
      room: values.sala ?? '',
      section: values.seccion ?? '',
      shelf: values.estante ?? '',
      inventoryCode: values.codigo_ejemplar ?? '',
      status: this.parseStatus(values.estado ?? ''),
      digitalUrl: values.url_digital || undefined,
    };
  }

  private splitList(value: string): string[] {
    return value
      .split(';')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private parseYear(value: string): number | undefined {
    if (!value) {
      return undefined;
    }

    if (!/^\d+$/.test(value)) {
      throw new ImportRowError(
        'anio',
        'El año debe contener únicamente dígitos',
      );
    }

    const year = Number(value);

    if (!Number.isSafeInteger(year) || year > 2147483647) {
      throw new ImportRowError('anio', 'El año está fuera del rango permitido');
    }

    return year;
  }

  private parseStatus(value: string): ImportedCopyStatus {
    if (!value) {
      return 'DISPONIBLE';
    }

    const normalized = normalizeText(value).toUpperCase();
    switch (normalized) {
      case 'DISPONIBLE':
      case 'PRESTADO':
      case 'MANTENIMIENTO':
      case 'BAJA':
        return normalized;
      default:
        throw new ImportRowError(
          'estado',
          'El estado del ejemplar no es válido',
        );
    }
  }
}
