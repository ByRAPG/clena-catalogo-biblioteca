import { ImportRow, type ImportRowInput } from './import-row';
import { ImportRowError } from '../errors/import-row-error';

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
});
