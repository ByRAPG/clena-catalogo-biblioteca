import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { InvalidCsvError } from '../../domain/errors/invalid-csv.error';
import { CSV_IMPORT_LIMITS } from '../../domain/value-objects/csv-limits';
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

  it('lee los archivos de ejemplo UTF-8 sin BOM, UTF-8 con BOM, Windows-1252 con punto y coma y TSV con alias', () => {
    const fixturesDir = join(process.cwd(), 'test/fixtures/import');

    const utf8 = reader.read(
      readFileSync(join(fixturesDir, 'utf8-sin-bom-comas.csv')),
    );
    expect(utf8).toHaveLength(1);
    expect(utf8[0]).toMatchObject({
      success: true,
      data: {
        title: 'Crónicas del puerto',
        inventoryCode: 'FIX-UTF8-001',
      },
    });

    const utf8Bom = reader.read(
      readFileSync(join(fixturesDir, 'utf8-con-bom.csv')),
    );
    expect(utf8Bom).toHaveLength(1);
    expect(utf8Bom[0]).toMatchObject({
      success: true,
      data: {
        title: 'Memorias de la bahía',
        inventoryCode: 'FIX-BOM-001',
      },
    });

    const win1252 = reader.read(
      readFileSync(join(fixturesDir, 'windows-1252-punto-y-coma.csv')),
    );
    expect(win1252).toHaveLength(1);
    expect(win1252[0]).toMatchObject({
      success: true,
      data: {
        title: 'Crónica del año español',
        authors: ['Sofía Peña', 'Inés Núñez'],
        subjects: ['Narración', 'Historia'],
        year: 2018,
        section: 'Sección Ñ',
        inventoryCode: 'FIX-WIN-001',
      },
    });

    const tsv = reader.read(
      readFileSync(join(fixturesDir, 'tabulador-alias-reordenado.tsv')),
    );
    expect(tsv).toHaveLength(1);
    expect(tsv[0]).toMatchObject({
      success: true,
      data: {
        title: 'Atlas de mareas',
        authors: ['Marina Ceiba', 'Rodrigo Palmera'],
        subjects: ['Cartografía', 'Geografía'],
        year: 2022,
        room: 'Sala General',
        section: 'Referencia',
        shelf: 'R-01',
        inventoryCode: 'FIX-TSV-001',
        status: 'DISPONIBLE',
      },
    });
  });

  it('rechaza cabeceras duplicadas por alias o columnas desconocidas', () => {
    expect(() =>
      reader.read(
        'titulo,Title,sala,seccion,estante,codigo_ejemplar\nA,B,S,Se,E,C-1',
      ),
    ).toThrow(InvalidCsvError);
    expect(() =>
      reader.read(
        'titulo,desconocida,sala,seccion,estante,codigo_ejemplar\nA,B,S,Se,E,C-1',
      ),
    ).toThrow(InvalidCsvError);
  });

  it('rechaza archivos que superan el máximo de 5 000 filas', () => {
    const compactHeader = 'titulo,sala,seccion,estante,codigo_ejemplar';
    const rows = Array.from(
      { length: CSV_IMPORT_LIMITS.maxRows + 1 },
      (_, i) => `L${i},S,Se,E,C${i}`,
    );

    expect(() => reader.read([compactHeader, ...rows].join('\n'))).toThrow(
      new InvalidCsvError(
        `El archivo supera el máximo permitido de ${CSV_IMPORT_LIMITS.maxRows} filas por importación`,
      ),
    );
  });
});
