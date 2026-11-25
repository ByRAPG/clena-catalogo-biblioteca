import type { ImportRowInput } from '../../domain/entities/import-row';
import type { ICatalogImportRepository } from '../../domain/repositories/catalog-import.repository';
import type { ICatalogCsvReader } from '../ports/catalog-csv-reader';
import { SimulateCatalogImportUseCase } from './simulate-catalog-import.use-case';

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

describe('SimulateCatalogImportUseCase', () => {
  let reader: jest.Mocked<ICatalogCsvReader>;
  let repository: jest.Mocked<ICatalogImportRepository>;
  let useCase: SimulateCatalogImportUseCase;

  beforeEach(() => {
    reader = {
      read: jest.fn(),
    };

    repository = {
      saveRow: jest.fn(),
      simulateRows: jest.fn(),
    };

    useCase = new SimulateCatalogImportUseCase(reader, repository);
  });

  it('simula obras y ejemplares creados, actualizados y fallidos sin escribir en BD', async () => {
    reader.read.mockReturnValue([
      { row: 2, success: true, data: validInput('SIM-001') },
      {
        row: 3,
        success: false,
        field: 'anio',
        error: 'El año no es un número',
      },
      {
        row: 4,
        success: true,
        data: { ...validInput('SIM-002'), title: ' ' },
      },
      { row: 5, success: true, data: validInput('SIM-003') },
      { row: 6, success: true, data: validInput('SIM-004') },
      { row: 7, success: true, data: validInput('SIM-005') },
    ]);

    repository.simulateRows.mockResolvedValue([
      {
        row: 2,
        status: 'created',
        workKey: 'work-new',
        workOutcome: 'created',
      },
      {
        row: 5,
        status: 'created',
        workKey: 'work-new',
        workOutcome: 'updated',
      },
      {
        row: 6,
        status: 'updated',
        workKey: 'work-existing',
        workOutcome: 'updated',
      },
      {
        row: 7,
        status: 'failed',
        field: 'estado',
        error: 'El ejemplar tiene un préstamo o reserva activos',
      },
    ]);

    const report = await useCase.execute('contenido CSV');

    expect(report).toEqual({
      dryRun: true,
      created: 2,
      updated: 1,
      failed: 3,
      works: { created: 1, updated: 1 },
      copies: { created: 2, updated: 1 },
      rows: [
        { row: 2, status: 'created' },
        {
          row: 3,
          status: 'failed',
          field: 'anio',
          error: 'El año no es un número',
        },
        {
          row: 4,
          status: 'failed',
          field: 'titulo',
          error: 'El campo titulo es obligatorio',
        },
        { row: 5, status: 'created' },
        { row: 6, status: 'updated' },
        {
          row: 7,
          status: 'failed',
          field: 'estado',
          error: 'El ejemplar tiene un préstamo o reserva activos',
        },
      ],
    });
    expect(repository.saveRow).not.toHaveBeenCalled();
    expect(repository.simulateRows).toHaveBeenCalledTimes(1);
  });

  it('no consulta el repositorio cuando todas las filas fallan en lectura o dominio', async () => {
    reader.read.mockReturnValue([
      {
        row: 2,
        success: false,
        field: 'titulo',
        error: 'El campo titulo es obligatorio',
      },
    ]);

    const report = await useCase.execute('contenido CSV');

    expect(report).toEqual({
      dryRun: true,
      created: 0,
      updated: 0,
      failed: 1,
      works: { created: 0, updated: 0 },
      copies: { created: 0, updated: 0 },
      rows: [
        {
          row: 2,
          status: 'failed',
          field: 'titulo',
          error: 'El campo titulo es obligatorio',
        },
      ],
    });
    expect(repository.simulateRows).not.toHaveBeenCalled();
  });

  it('omite resultados faltantes de simulación si el repositorio no devuelve alguna fila', async () => {
    reader.read.mockReturnValue([
      { row: 2, success: true, data: validInput('SIM-001') },
    ]);
    repository.simulateRows.mockResolvedValue([]);

    const report = await useCase.execute('contenido CSV');

    expect(report.rows).toEqual([]);
    expect(report.created).toBe(0);
    expect(report.updated).toBe(0);
    expect(report.failed).toBe(0);
  });
});
