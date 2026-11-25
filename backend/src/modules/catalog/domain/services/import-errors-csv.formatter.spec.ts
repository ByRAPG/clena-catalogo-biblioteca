import { formatImportErrorsCsv } from './import-errors-csv.formatter';

describe('formatImportErrorsCsv', () => {
  it('genera solo el encabezado cuando no hay errores', () => {
    expect(formatImportErrorsCsv([])).toBe('fila,campo,error\n');
  });

  it('formatea errores con y sin campo asociado', () => {
    const csv = formatImportErrorsCsv([
      { row: 2, field: 'titulo', error: 'El campo titulo es obligatorio' },
      { row: 5, error: 'Cantidad inválida de columnas' },
    ]);

    expect(csv).toBe(
      [
        'fila,campo,error',
        '2,titulo,El campo titulo es obligatorio',
        '5,,Cantidad inválida de columnas',
        '',
      ].join('\n'),
    );
  });

  it('escapa comas, comillas y saltos de línea según RFC 4180', () => {
    const csv = formatImportErrorsCsv([
      {
        row: 3,
        field: 'url_digital',
        error: 'Valor "inválido", revise la línea\nsiguiente',
      },
    ]);

    expect(csv).toBe(
      'fila,campo,error\n3,url_digital,"Valor ""inválido"", revise la línea\nsiguiente"\n',
    );
  });

  it('neutraliza celdas que comienzan con caracteres de fórmula', () => {
    const csv = formatImportErrorsCsv([
      { row: 4, field: '=campo', error: '+SUM(A1:A2)' },
      { row: 6, field: ' -campo', error: '@cmd' },
    ]);

    expect(csv).toBe(
      [
        'fila,campo,error',
        "4,'=campo,'+SUM(A1:A2)",
        "6,' -campo,'@cmd",
        '',
      ].join('\n'),
    );
  });
});
