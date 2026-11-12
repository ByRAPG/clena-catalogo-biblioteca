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
    };

    importJobs = {
      save: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new ImportCatalogUseCase(reader, repository, importJobs);
  });

  it('importa las filas válidas aunque otra tenga errores de dominio', async () => {
    reader.read.mockReturnValue([
      { row: 2, success: true, data: validInput('PRUEBA-001') },
      {
        row: 3,
        success: true,
        data: { ...validInput('PRUEBA-002'), title: ' ' },
      },
      { row: 4, success: true, data: validInput('PRUEBA-003') },
    ]);

    repository.saveRow
      .mockResolvedValueOnce('created')
      .mockResolvedValueOnce('updated');

    const report = await useCase.execute(
      'contenido CSV',
      'catalogo.csv',
      'admin-id',
    );

    expect(report).toEqual({
      created: 1,
      updated: 1,
      failed: 1,
      rows: [
        { row: 2, status: 'created' },
        {
          row: 3,
          status: 'failed',
          field: 'titulo',
          error: 'El campo titulo es obligatorio',
        },
        { row: 4, status: 'updated' },
      ],
    });

    expect(repository.saveRow).toHaveBeenCalledTimes(2);
    expect(
      repository.saveRow.mock.calls.map(([row]) => row.data.inventoryCode),
    ).toEqual(['PRUEBA-001', 'PRUEBA-003']);

    expect(importJobs.save).toHaveBeenCalledTimes(1);
    expect(importJobs.save).toHaveBeenCalledWith({
      fileName: 'catalogo.csv',
      userId: 'admin-id',
      report,
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

    repository.saveRow.mockResolvedValue('created');

    const report = await useCase.execute(
      'contenido CSV',
      'catalogo.csv',
      'admin-id',
    );

    expect(report.created).toBe(1);
    expect(report.failed).toBe(1);
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
});
