import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { InvalidCsvError } from '../../domain/errors/invalid-csv.error';
import { CatalogCsvReader } from './catalog-csv.reader';

const HEADER =
  'titulo,autor,tema,isbn,clasificacion,anio,editorial,categoria,sala,seccion,estante,codigo_ejemplar,estado,url_digital';

function csvRow(
  inventoryCode: string,
  title = 'Libro ficticio',
  year = '2024',
): string {
  return [
    title,
    'Autora Uno;Autor Dos',
    'Literatura;Historia',
    '',
    '863',
    year,
    'Editorial Ficticia',
    'Literatura',
    'Sala General',
    'Narrativa',
    'N-01',
    inventoryCode,
    'DISPONIBLE',
    '',
  ].join(',');
}

describe('CatalogCsvReader', () => {
  const reader = new CatalogCsvReader();

  it('lee la plantilla existente del repositorio', () => {
    const content = readFileSync(
      join(process.cwd(), 'prisma/data/plantilla-catalogo.csv'),
      'utf8',
    );

    const results = reader.read(content);

    expect(results).toHaveLength(3);
    expect(results.every((result) => result.success)).toBe(true);
    expect(results[0]).toMatchObject({
      row: 2,
      success: true,
      data: {
        title: 'La biblioteca de las mareas',
        inventoryCode: 'PLANTILLA-0001',
      },
    });
  });

  it('interpreta comas dentro de títulos entre comillas y listas separadas por punto y coma', () => {
    const results = reader.read(
      `${HEADER}\n${csvRow('PRUEBA-001', '"Mareas, mapas y libros"')}`,
    );

    expect(results[0]).toMatchObject({
      row: 2,
      success: true,
      data: {
        title: 'Mareas, mapas y libros',
        authors: ['Autora Uno', 'Autor Dos'],
        subjects: ['Literatura', 'Historia'],
      },
    });
  });

  it('reporta columnas incompletas y continúa con la siguiente fila', () => {
    const results = reader.read(
      [HEADER, 'Libro incompleto,Autora', csvRow('PRUEBA-002')].join('\n'),
    );

    expect(results).toEqual([
      {
        row: 2,
        success: false,
        error: 'La cantidad de columnas no coincide con la cabecera',
      },
      {
        row: 3,
        success: true,
        data: expect.objectContaining({
          inventoryCode: 'PRUEBA-002',
        }),
      },
    ]);
  });

  it('reporta un año ilegible sin impedir leer la siguiente fila', () => {
    const results = reader.read(
      [
        HEADER,
        csvRow('PRUEBA-001', 'Libro ficticio', 'abc'),
        csvRow('PRUEBA-002'),
      ].join('\n'),
    );

    expect(results[0]).toMatchObject({
      row: 2,
      success: false,
      field: 'anio',
    });
    expect(results[1]).toMatchObject({
      row: 3,
      success: true,
    });
  });

  it('lee 500 filas', () => {
    const rows = Array.from({ length: 500 }, (_, index) =>
      csvRow(`PRUEBA-${index + 1}`),
    );

    const results = reader.read([HEADER, ...rows].join('\n'));

    expect(results).toHaveLength(500);
    expect(results.every((result) => result.success)).toBe(true);
    expect(results[499].row).toBe(501);
  });

  it('reporta años que no caben en el esquema y conserva la siguiente fila', () => {
    const results = reader.read(
      [
        HEADER,
        csvRow('INVALID-YEAR', 'Libro ficticio', '2147483648'),
        csvRow('VALID-YEAR'),
      ].join('\n'),
    );
    expect(results[0]).toMatchObject({ success: false, row: 2, field: 'anio' });
    expect(results[1]).toMatchObject({ success: true, row: 3 });
  });

  it.each(['', 'titulo,autor\nLibro,Autora'])(
    'rechaza archivos vacíos o con cabeceras incorrectas',
    (content) => {
      expect(() => reader.read(content)).toThrow(InvalidCsvError);
    },
  );

  it('rechaza comillas sin cerrar', () => {
    expect(() => reader.read(`${HEADER}\n"Texto sin cerrar`)).toThrow(
      InvalidCsvError,
    );
  });

  it('acepta BOM y conserva la numeración con líneas vacías', () => {
    const results = reader.read(`\uFEFF${HEADER}\n\n${csvRow('PRUEBA-001')}`);

    expect(results[0]).toMatchObject({
      row: 3,
      success: true,
    });
  });
});
