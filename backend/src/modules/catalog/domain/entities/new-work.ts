import { normalizeText } from '../../../../shared/domain/normalize-text';
import { InvalidWorkError } from '../errors/invalid-work.error';

export interface NewWorkInput {
  title: string;
  authors: readonly string[];
  subjects?: readonly string[];
  categoryId?: string | null;
  year?: number | null;
}

/**
 * Obra que el personal registra a mano (HU-10). Exige título y al menos un
 * autor. Los autores y temas repetidos con otra escritura («García Márquez» y
 * «garcia marquez») se reducen a uno; se conserva la primera escritura y el
 * orden, porque el primer autor es el principal.
 */
export class NewWork {
  private constructor(
    public readonly title: string,
    public readonly authors: readonly string[],
    public readonly subjects: readonly string[],
    public readonly categoryId: string | null,
    public readonly year: number | null,
  ) {}

  static create(input: NewWorkInput, currentYear: number): NewWork {
    const title = input.title.trim().replace(/\s+/g, ' ');
    if (!title) {
      throw new InvalidWorkError('title', 'Escriba el título del libro');
    }
    const authors = uniqueNames(input.authors);
    if (authors.length === 0) {
      throw new InvalidWorkError('authors', 'Escriba al menos un autor');
    }
    const year = input.year ?? null;
    if (year !== null && !isValidYear(year, currentYear)) {
      throw new InvalidWorkError(
        'year',
        `El año debe ser un número entre 1 y ${currentYear + 1}`,
      );
    }
    return new NewWork(
      title,
      authors,
      uniqueNames(input.subjects ?? []),
      input.categoryId ?? null,
      year,
    );
  }
}

function isValidYear(year: number, currentYear: number): boolean {
  return Number.isInteger(year) && year >= 1 && year <= currentYear + 1;
}

function uniqueNames(names: readonly string[]): readonly string[] {
  const byKey = new Map<string, string>();
  for (const raw of names) {
    const name = raw.trim().replace(/\s+/g, ' ');
    const key = normalizeText(name);
    if (key && !byKey.has(key)) byKey.set(key, name);
  }
  return Object.freeze([...byKey.values()]);
}
