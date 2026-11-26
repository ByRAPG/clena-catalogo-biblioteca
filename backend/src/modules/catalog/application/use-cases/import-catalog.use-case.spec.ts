import type { ImportRowInput } from '../../domain/entities/import-row';
import type { ICatalogImportRepository } from '../../domain/repositories/catalog-import.repository';
import type { ICatalogCsvReader } from '../ports/catalog-csv-reader';
import type { IImportJobRepository } from '../ports/import-job.repository';
import { ImportCatalogUseCase } from './import-catalog.use-case';

function validInput(inventoryCode: string): ImportRowInput {
  return {
    title: 'Libro de ejemplo',
    authors: ['Autora ficticia'],
    subjects: ['Literatura'],
    room: 'Sala General',
    section: 'Narrativa',
    shelf: 'N-01',
    inventoryCode,
    status: 'DISPONIBLE',
  };
}

describe('ImportCatalogUseCase', () => {
  let reader: jest.Mocked<ICatalogCsvReader>;
  let repository: jest.Mocked<ICatalogImportRepository>;
  let useCase: ImportCatalogUseCase;
  let importJobs: jest.Mocked<IImportJobRepository>;

  beforeEach(() => {
    reader = {
      read: jest.fn(),
    };

    repository = {
      saveRow: jest.fn(),
      simulateRows: jest.fn(),
    };

    importJobs = {
      save: jest.fn().mockResolvedValue('job-uuid-1'),
      findById: jest.fn(),
    };

    useCase = new ImportCatalogUseCase(reader, repository, importJobs);
  });

  it('importa las filas válidas aunque otra tenga errores de dominio y cuenta obras y ejemplares', async () => {
    reader.read.mockReturnValue([
      { row: 2, success: true, data: validInput('PRUEBA-001') },
      {
        row: 3,
        success: true,
        data: { ...validInput('PRUEBA-002'), title: ' ' },
      },
      { row: 4, success: true, data: validInput('PRUEBA-003') },
      { row: 5, success: true, data: validInput('PRUEBA-004') },
    ]);

    repository.saveRow
      .mockResolvedValueOnce({
        workKey: 'work-1',
        workOutcome: 'created',
        copyOutcome: 'created',
      })
      .mockResolvedValueOnce({
        workKey: 'work-1',
        workOutcome: 'updated',
        copyOutcome: 'created',
      })
      .mockResolvedValueOnce({
        workKey: 'work-2',
        workOutcome: 'updated',
        copyOutcome: 'updated',
      });

    const report = await useCase.execute(
      'contenido CSV',
      'catalogo.csv',
      'admin-id',
    );

    expect(report).toEqual({
      importId: 'job-uuid-1',
      dryRun: false,
      created: 2,
      updated: 1,
      failed: 1,
      works: { created: 1, updated: 1 },
      copies: { created: 2, updated: 1 },
      rows: [
        { row: 2, status: 'created' },
        {
          row: 3,
          status: 'failed',
          field: 'titulo',
          error: 'El campo titulo es obligatorio',
        },
        { row: 4, status: 'created' },
        { row: 5, status: 'updated' },
      ],
    });

    expect(repository.saveRow).toHaveBeenCalledTimes(3);
    expect(
      repository.saveRow.mock.calls.map(([row]) => row.data.inventoryCode),
    ).toEqual(['PRUEBA-001', 'PRUEBA-003', 'PRUEBA-004']);

    expect(importJobs.save).toHaveBeenCalledTimes(1);
    expect(importJobs.save).toHaveBeenCalledWith({
      fileName: 'catalogo.csv',
      userId: 'admin-id',
      report: expect.objectContaining({
        dryRun: false,
        created: 2,
        updated: 1,
        failed: 1,
      }),
    });
  });

  it('reporta errores de lectura y continúa con la siguiente fila', async () => {
    reader.read.mockReturnValue([
      {
        row: 2,
        success: false,
        field: 'anio',
        error: 'El año no es un número',
      },
      { row: 3, success: true, data: validInput('PRUEBA-001') },
    ]);

    repository.saveRow.mockResolvedValue({
      workKey: 'work-1',
      workOutcome: 'created',
      copyOutcome: 'created',
    });

    const report = await useCase.execute(
      'contenido CSV',
      'catalogo.csv',
      'admin-id',
    );

    expect(report.created).toBe(1);
    expect(report.failed).toBe(1);
    expect(report.works).toEqual({ created: 1, updated: 0 });
    expect(report.copies).toEqual({ created: 1, updated: 0 });
    expect(report.rows).toEqual([
      {
        row: 2,
        status: 'failed',
        field: 'anio',
        error: 'El año no es un número',
      },
      { row: 3, status: 'created' },
    ]);
    expect(repository.saveRow).toHaveBeenCalledTimes(1);
  });

  it('propaga fallos inesperados de persistencia', async () => {
    reader.read.mockReturnValue([
      { row: 2, success: true, data: validInput('PRUEBA-001') },
    ]);

    const error = new Error('Base de datos no disponible');
    repository.saveRow.mockRejectedValue(error);

    await expect(
      useCase.execute('contenido CSV', 'catalogo.csv', 'admin-id'),
    ).rejects.toBe(error);

    expect(importJobs.save).not.toHaveBeenCalled();
  });

  it('reporta campos que superan el límite de longitud sin detener las filas válidas', async () => {
    reader.read.mockReturnValue([
      {
        row: 2,
        success: true,
        data: { ...validInput('PRUEBA-LARGO'), title: 'x'.repeat(301) },
      },
      { row: 3, success: true, data: validInput('PRUEBA-OK') },
    ]);

    repository.saveRow.mockResolvedValue({
      workKey: 'work-ok',
      workOutcome: 'created',
      copyOutcome: 'created',
    });

    const report = await useCase.execute(
      new Uint8Array([1, 2, 3]),
      'catalogo.csv',
      'admin-id',
    );

    expect(report).toEqual({
      importId: 'job-uuid-1',
      dryRun: false,
      created: 1,
      updated: 0,
      failed: 1,
      works: { created: 1, updated: 0 },
      copies: { created: 1, updated: 0 },
      rows: [
        {
          row: 2,
          status: 'failed',
          field: 'titulo',
          error: 'El campo titulo supera el máximo de 300 caracteres',
        },
        { row: 3, status: 'created' },
      ],
    });
    expect(reader.read).toHaveBeenCalledWith(expect.any(Uint8Array));
  });

  it('rechaza filas con ISBN inválido y neutraliza fórmulas en las válidas', async () => {
    reader.read.mockReturnValue([
      {
        row: 2,
        success: true,
        data: { ...validInput('PRUEBA-ISBN-BAD'), isbn: '9789990000019' },
      },
      {
        row: 3,
        success: true,
        data: {
          ...validInput('PRUEBA-FORMULA'),
          title: '=SUM(1,2)',
          isbn: '978-999-000001-6',
        },
      },
    ]);

    repository.saveRow.mockResolvedValue({
      workKey: 'work-ok',
      workOutcome: 'created',
      copyOutcome: 'created',
    });

    const report = await useCase.execute(
      'contenido CSV',
      'catalogo.csv',
      'admin-id',
    );

    expect(report).toMatchObject({
      created: 1,
      updated: 0,
      failed: 1,
      rows: [
        {
          row: 2,
          status: 'failed',
          field: 'isbn',
          error: 'El ISBN debe ser un ISBN-10 o ISBN-13 válido',
        },
        { row: 3, status: 'created' },
      ],
    });
    expect(repository.saveRow).toHaveBeenCalledTimes(1);
    const [savedRow] = repository.saveRow.mock.calls[0];
    expect(savedRow.data.title).toBe("'=SUM(1,2)");
    expect(savedRow.data.isbn).toBe('9789990000016');
  });
});
