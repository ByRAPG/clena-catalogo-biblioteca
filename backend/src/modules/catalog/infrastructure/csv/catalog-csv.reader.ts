import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
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

interface ParsedRecord {
  record: string[];
  info: {
    lines: number;
  };
}

const CSV_HEADERS = [
  'titulo',
  'autor',
  'tema',
  'isbn',
  'clasificacion',
  'anio',
  'editorial',
  'categoria',
  'sala',
  'seccion',
  'estante',
  'codigo_ejemplar',
  'estado',
  'url_digital',
];

@Injectable()
export class CatalogCsvReader implements ICatalogCsvReader {
  read(content: string): CsvRowResult[] {
    const records = this.parseRecords(content);
    const header = records.shift();

    if (!header) {
      throw new InvalidCsvError('El archivo CSV está vacío');
    }

    this.validateHeaders(header.record);

    return records.map((entry) => this.convertRow(header.record, entry));
  }

  private parseRecords(content: string): ParsedRecord[] {
    let records: unknown;

    try {
      records = parse(content, {
        bom: true,
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

  private validateHeaders(headers: string[]): void {
    const uniqueHeaders = new Set(headers);

    if (
      headers.length !== CSV_HEADERS.length ||
      uniqueHeaders.size !== headers.length ||
      CSV_HEADERS.some((header) => !uniqueHeaders.has(header))
    ) {
      throw new InvalidCsvError(
        'Las cabeceras deben coincidir con la plantilla del catálogo',
      );
    }
  }

  private convertRow(headers: string[], entry: ParsedRecord): CsvRowResult {
    const row = entry.info.lines;

    if (entry.record.length !== headers.length) {
      return {
        row,
        success: false,
        error: 'La cantidad de columnas no coincide con la cabecera',
      };
    }

    const values: Record<string, string> = Object.fromEntries(
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

  private toInput(values: Record<string, string>): ImportRowInput {
    return {
      title: values.titulo,
      authors: this.splitList(values.autor),
      subjects: this.splitList(values.tema),
      isbn: values.isbn || undefined,
      classification: values.clasificacion || undefined,
      year: this.parseYear(values.anio),
      publisher: values.editorial || undefined,
      category: values.categoria || undefined,
      room: values.sala,
      section: values.seccion,
      shelf: values.estante,
      inventoryCode: values.codigo_ejemplar,
      status: this.parseStatus(values.estado),
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
    switch (value) {
      case 'DISPONIBLE':
      case 'PRESTADO':
      case 'MANTENIMIENTO':
      case 'BAJA':
        return value;
      default:
        throw new ImportRowError(
          'estado',
          'El estado del ejemplar no es válido',
        );
    }
  }
}
