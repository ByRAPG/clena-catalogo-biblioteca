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

  it('normaliza ISBN-13 e ISBN-10 válidos con guiones', () => {
    const isbn13 = new ImportRow({
      ...validInput(),
      isbn: '978-999-000001-6',
    });
    const isbn10 = new ImportRow({
      ...validInput(),
      isbn: '0-8044-2957-x',
    });

    expect(isbn13.data.isbn).toBe('9789990000016');
    expect(isbn10.data.isbn).toBe('080442957X');
  });

  it('rechaza un ISBN con dígito de control inválido', () => {
    expect.assertions(2);

    try {
      new ImportRow({ ...validInput(), isbn: '978-999-000001-9' });
    } catch (error) {
      expect(error).toBeInstanceOf(ImportRowError);
      expect((error as ImportRowError).field).toBe('isbn');
    }
  });

  it('neutraliza prefijos de fórmula (=, +, -, @) en todos los campos textuales', () => {
    const row = new ImportRow({
      ...validInput(),
      title: '=HYPERLINK("https://example.org")',
      authors: ['+Autor Uno', '-Autor Dos'],
      subjects: ['@Tema'],
      classification: '=863',
      publisher: '+Editorial',
      category: '-Literatura',
      room: '@Sala',
      section: '=Seccion',
      shelf: '+E-01',
      inventoryCode: '-EJEMP-1',
    });

    expect(row.data).toMatchObject({
      title: '\'=HYPERLINK("https://example.org")',
      authors: ["'+Autor Uno", "'-Autor Dos"],
      subjects: ["'@Tema"],
      classification: "'=863",
      publisher: "'+Editorial",
      category: "'-Literatura",
      room: "'@Sala",
      section: "'=Seccion",
      shelf: "'+E-01",
      inventoryCode: "'-EJEMP-1",
    });
  });
});
