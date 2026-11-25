import { ImportRowError } from '../errors/import-row-error';
import { CSV_IMPORT_LIMITS } from '../value-objects/csv-limits';
import { Isbn } from '../value-objects/isbn.vo';
import {
  neutralizeFormula,
  neutralizeOptionalFormula,
} from '../value-objects/neutralize-formula';

export type ImportedCopyStatus =
  'DISPONIBLE' | 'PRESTADO' | 'MANTENIMIENTO' | 'BAJA';

export interface ImportRowInput {
  title: string;
  authors: string[];
  subjects: string[];
  isbn?: string;
  classification?: string;
  year?: number;
  publisher?: string;
  category?: string;
  room: string;
  section: string;
  shelf: string;
  inventoryCode: string;
  status: ImportedCopyStatus;
  digitalUrl?: string;
}

export type ImportRowData = Readonly<
  Omit<ImportRowInput, 'authors' | 'subjects'> & {
    authors: readonly string[];
    subjects: readonly string[];
  }
>;

export class ImportRow {
  public readonly data: ImportRowData;

  constructor(input: ImportRowInput) {
    this.validate(input);

    const normalizedIsbn =
      input.isbn && input.isbn.trim()
        ? Isbn.create(input.isbn).value
        : undefined;

    this.data = Object.freeze({
      ...input,
      title: neutralizeFormula(input.title),
      authors: Object.freeze(
        input.authors.map((author) => neutralizeFormula(author)),
      ),
      subjects: Object.freeze(
        input.subjects.map((subject) => neutralizeFormula(subject)),
      ),
      isbn: normalizedIsbn,
      classification: neutralizeOptionalFormula(input.classification),
      publisher: neutralizeOptionalFormula(input.publisher),
      category: neutralizeOptionalFormula(input.category),
      room: neutralizeFormula(input.room),
      section: neutralizeFormula(input.section),
      shelf: neutralizeFormula(input.shelf),
      inventoryCode: neutralizeFormula(input.inventoryCode),
    });
  }

  private validate(input: ImportRowInput): void {
    this.requireText(input.title, 'titulo');
    this.requireText(input.room, 'sala');
    this.requireText(input.section, 'seccion');
    this.requireText(input.shelf, 'estante');
    this.requireText(input.inventoryCode, 'codigo_ejemplar');

    this.validateLimits(input);
    this.validateYear(input.year);
    this.validateStatus(input.status);
    this.validateDigitalUrl(input.digitalUrl);
  }

  private requireText(value: string, field: string): void {
    if (!value.trim()) {
      throw new ImportRowError(field, `El campo ${field} es obligatorio`);
    }
  }

  private validateLimits(input: ImportRowInput): void {
    const { maxLengths, maxListItems } = CSV_IMPORT_LIMITS;

    this.validateMaxLength(input.title, 'titulo', maxLengths.title);
    this.validateListLimits(
      input.authors,
      'autor',
      maxListItems,
      maxLengths.author,
    );
    this.validateListLimits(
      input.subjects,
      'tema',
      maxListItems,
      maxLengths.subject,
    );
    this.validateMaxLength(input.isbn, 'isbn', maxLengths.isbn);
    this.validateMaxLength(
      input.classification,
      'clasificacion',
      maxLengths.classification,
    );
    this.validateMaxLength(input.publisher, 'editorial', maxLengths.publisher);
    this.validateMaxLength(input.category, 'categoria', maxLengths.category);
    this.validateMaxLength(input.room, 'sala', maxLengths.room);
    this.validateMaxLength(input.section, 'seccion', maxLengths.section);
    this.validateMaxLength(input.shelf, 'estante', maxLengths.shelf);
    this.validateMaxLength(
      input.inventoryCode,
      'codigo_ejemplar',
      maxLengths.inventoryCode,
    );
    this.validateMaxLength(
      input.digitalUrl,
      'url_digital',
      maxLengths.digitalUrl,
    );
  }

  private validateMaxLength(
    value: string | undefined,
    field: string,
    maxLength: number,
  ): void {
    if (value !== undefined && value.trim().length > maxLength) {
      throw new ImportRowError(
        field,
        `El campo ${field} supera el máximo de ${maxLength} caracteres`,
      );
    }
  }

  private validateListLimits(
    items: readonly string[],
    field: string,
    maxItems: number,
    maxItemLength: number,
  ): void {
    if (items.length > maxItems) {
      throw new ImportRowError(
        field,
        `El campo ${field} supera el máximo de ${maxItems} elementos`,
      );
    }

    for (const item of items) {
      this.validateMaxLength(item, field, maxItemLength);
    }
  }

  private validateYear(year: number | undefined): void {
    if (year !== undefined && !Number.isInteger(year)) {
      throw new ImportRowError('anio', 'El año debe ser un número entero');
    }
  }

  private validateStatus(status: ImportedCopyStatus): void {
    const allowedStatuses: readonly string[] = [
      'DISPONIBLE',
      'PRESTADO',
      'MANTENIMIENTO',
      'BAJA',
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ImportRowError('estado', 'El estado del ejemplar no es válido');
    }
  }

  private validateDigitalUrl(value: string | undefined): void {
    if (value === undefined) {
      return;
    }

    let url: URL;

    try {
      url = new URL(value);
    } catch {
      throw new ImportRowError('url_digital', 'La URL digital no es válida');
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new ImportRowError(
        'url_digital',
        'La URL digital debe usar HTTP o HTTPS',
      );
    }
  }
}
