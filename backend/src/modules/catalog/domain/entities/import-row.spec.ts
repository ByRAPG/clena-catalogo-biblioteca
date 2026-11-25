import { ImportRow, type ImportRowInput } from './import-row';
import { ImportRowError } from '../errors/import-row-error';
import { CSV_IMPORT_LIMITS } from '../value-objects/csv-limits';

function validInput(): ImportRowInput {
  return {
    title: 'Libro de ejemplo',
    authors: ['Autora ficticia'],
    subjects: ['Literatura'],
    room: 'Sala General',
    section: 'Narrativa',
    shelf: 'N-01',
    inventoryCode: 'PRUEBA-001',
    status: 'DISPONIBLE',
  };
}

describe('ImportRow', () => {
  it('acepta una fila válida sin ISBN', () => {
    const row = new ImportRow(validInput());

    expect(row.data.title).toBe('Libro de ejemplo');
    expect(row.data.isbn).toBeUndefined();
  });

  it.each([
    ['title', 'titulo'],
    ['room', 'sala'],
    ['section', 'seccion'],
    ['shelf', 'estante'],
    ['inventoryCode', 'codigo_ejemplar'],
  ] as const)('rechaza el campo obligatorio vacío: %s', (property, field) => {
    expect.assertions(2);

    try {
      new ImportRow({ ...validInput(), [property]: '   ' });
    } catch (error) {
      expect(error).toBeInstanceOf(ImportRowError);
      expect((error as ImportRowError).field).toBe(field);
    }
  });

  it.each([2024.5, NaN, Infinity])('rechaza el año inválido %s', (year) => {
    expect(() => new ImportRow({ ...validInput(), year })).toThrow(
      ImportRowError,
    );
  });

  it.each(['texto inválido', 'javascript:alert(1)', 'ftp://example.org'])(
    'rechaza la URL digital %s',
    (digitalUrl) => {
      expect(() => new ImportRow({ ...validInput(), digitalUrl })).toThrow(
        ImportRowError,
      );
    },
  );

  it.each(['http://example.org', 'https://example.org/libro'])(
    'acepta la URL digital %s',
    (digitalUrl) => {
      expect(
        new ImportRow({ ...validInput(), digitalUrl }).data.digitalUrl,
      ).toBe(digitalUrl);
    },
  );

  it('conserva los autores aunque cambie el arreglo de entrada', () => {
    const input = validInput();
    const row = new ImportRow(input);

    input.authors.push('Otra autora');

    expect(row.data.authors).toEqual(['Autora ficticia']);
    expect(Object.isFrozen(row.data.authors)).toBe(true);
  });

  it.each([
    ['title', 'titulo', CSV_IMPORT_LIMITS.maxLengths.title],
    ['isbn', 'isbn', CSV_IMPORT_LIMITS.maxLengths.isbn],
    [
      'classification',
      'clasificacion',
      CSV_IMPORT_LIMITS.maxLengths.classification,
    ],
    ['publisher', 'editorial', CSV_IMPORT_LIMITS.maxLengths.publisher],
    ['category', 'categoria', CSV_IMPORT_LIMITS.maxLengths.category],
    ['room', 'sala', CSV_IMPORT_LIMITS.maxLengths.room],
    ['section', 'seccion', CSV_IMPORT_LIMITS.maxLengths.section],
    ['shelf', 'estante', CSV_IMPORT_LIMITS.maxLengths.shelf],
    [
      'inventoryCode',
      'codigo_ejemplar',
      CSV_IMPORT_LIMITS.maxLengths.inventoryCode,
    ],
  ] as const)(
    'rechaza el campo %s cuando supera %i caracteres',
    (property, field, maxLength) => {
      expect.assertions(2);

      try {
        new ImportRow({
          ...validInput(),
          [property]: 'a'.repeat(maxLength + 1),
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ImportRowError);
        expect((error as ImportRowError).field).toBe(field);
      }
    },
  );

  it('rechaza una URL digital que supera el máximo de caracteres', () => {
    const longUrl = `https://example.org/${'a'.repeat(CSV_IMPORT_LIMITS.maxLengths.digitalUrl)}`;

    expect(
      () => new ImportRow({ ...validInput(), digitalUrl: longUrl }),
    ).toThrow(ImportRowError);
  });

  it('rechaza listas de autores o temas que superan el máximo de elementos o longitud', () => {
    const tooManyAuthors = Array.from(
      { length: CSV_IMPORT_LIMITS.maxListItems + 1 },
      (_, i) => `Autor ${i + 1}`,
    );
    const longSubject = 't'.repeat(CSV_IMPORT_LIMITS.maxLengths.subject + 1);

    expect(
      () => new ImportRow({ ...validInput(), authors: tooManyAuthors }),
    ).toThrow(ImportRowError);
    expect(
      () => new ImportRow({ ...validInput(), subjects: [longSubject] }),
    ).toThrow(ImportRowError);
  });
});
