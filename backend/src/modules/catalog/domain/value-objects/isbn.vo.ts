import { ImportRowError } from '../errors/import-row-error';

const ALLOWED_RAW_ISBN = /^[0-9][0-9\s-]*[0-9Xx]$/;
const ISBN_10_PATTERN = /^\d{9}[\dX]$/;
const ISBN_13_PATTERN = /^(?:978|979)\d{10}$/;

/**
 * ISBN-10 o ISBN-13 validado (con dígito de control) y normalizado sin guiones
 * ni espacios, con «X» en mayúscula cuando aplica.
 */
export class Isbn {
  private constructor(readonly value: string) {}

  static create(raw: string): Isbn {
    const trimmed = raw.trim();
    if (!ALLOWED_RAW_ISBN.test(trimmed)) {
      throw new ImportRowError(
        'isbn',
        'El ISBN debe ser un ISBN-10 o ISBN-13 válido',
      );
    }

    const normalized = trimmed.replace(/[-\s]+/g, '').toUpperCase();
    if (!isValidIsbn10(normalized) && !isValidIsbn13(normalized)) {
      throw new ImportRowError(
        'isbn',
        'El ISBN debe ser un ISBN-10 o ISBN-13 válido',
      );
    }

    return new Isbn(normalized);
  }

  equals(other: Isbn): boolean {
    return this.value === other.value;
  }
}

function isValidIsbn10(value: string): boolean {
  if (!ISBN_10_PATTERN.test(value)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 10; i += 1) {
    const char = value[i];
    const digit = char === 'X' ? 10 : Number(char);
    sum += digit * (10 - i);
  }

  return sum % 11 === 0;
}

function isValidIsbn13(value: string): boolean {
  if (!ISBN_13_PATTERN.test(value)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 13; i += 1) {
    const digit = Number(value[i]);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }

  return sum % 10 === 0;
}
