import { ImportRowError } from '../errors/import-row-error';

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

    this.data = Object.freeze({
      ...input,
      title: input.title.trim(),
      authors: Object.freeze(input.authors.map((author) => author.trim())),
      subjects: Object.freeze(input.subjects.map((subject) => subject.trim())),
      room: input.room.trim(),
      section: input.section.trim(),
      shelf: input.shelf.trim(),
      inventoryCode: input.inventoryCode.trim(),
    });
  }

  private validate(input: ImportRowInput): void {
    this.requireText(input.title, 'titulo');
    this.requireText(input.room, 'sala');
    this.requireText(input.section, 'seccion');
    this.requireText(input.shelf, 'estante');
    this.requireText(input.inventoryCode, 'codigo_ejemplar');

    this.validateYear(input.year);
    this.validateStatus(input.status);
    this.validateDigitalUrl(input.digitalUrl);
  }

  private requireText(value: string, field: string): void {
    if (!value.trim()) {
      throw new ImportRowError(field, `El campo ${field} es obligatorio`);
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
