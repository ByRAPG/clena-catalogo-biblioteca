import { ImportJobNotFoundError } from '../../domain/errors/import-job-not-found.error';
import type { IImportJobRepository } from '../ports/import-job.repository';
import { GetImportErrorsCsvUseCase } from './get-import-errors-csv.use-case';
import type { SimulateCatalogImportUseCase } from './simulate-catalog-import.use-case';

describe('GetImportErrorsCsvUseCase', () => {
  let importJobs: jest.Mocked<IImportJobRepository>;
  let simulateImport: jest.Mocked<
    Pick<SimulateCatalogImportUseCase, 'execute'>
  >;
  let useCase: GetImportErrorsCsvUseCase;

  beforeEach(() => {
    importJobs = {
      save: jest.fn(),
      findById: jest.fn(),
    };

    simulateImport = {
      execute: jest.fn(),
    };

    useCase = new GetImportErrorsCsvUseCase(
      importJobs,
      simulateImport as unknown as SimulateCatalogImportUseCase,
    );
  });

  it('genera el CSV de errores para una importación guardada', async () => {
    importJobs.findById.mockResolvedValue({
      id: 'job-123',
      fileName: 'catalogo.csv',
      errors: [
        { row: 2, field: 'titulo', error: 'El campo titulo es obligatorio' },
        { row: 4, error: 'Fila incompleta' },
      ],
    });

    const result = await useCase.fromImportJob('job-123');

    expect(result).toEqual({
      fileName: 'errores-importacion-job-123.csv',
      csv: [
        'fila,campo,error',
        '2,titulo,El campo titulo es obligatorio',
        '4,,Fila incompleta',
        '',
      ].join('\n'),
    });
  });

  it('lanza ImportJobNotFoundError cuando el registro de importación no existe', async () => {
    importJobs.findById.mockResolvedValue(null);

    await expect(useCase.fromImportJob('missing-id')).rejects.toThrow(
      ImportJobNotFoundError,
    );
  });

  it('genera el CSV de errores desde una simulación sin incluir filas válidas', async () => {
    simulateImport.execute.mockResolvedValue({
      dryRun: true,
      created: 1,
      updated: 0,
      failed: 2,
      works: { created: 1, updated: 0 },
      copies: { created: 1, updated: 0 },
      rows: [
        { row: 2, status: 'created' },
        { row: 3, status: 'failed', field: 'anio', error: 'Año inválido' },
        { row: 4, status: 'failed', error: 'Error general' },
      ],
    });

    const result = await useCase.fromSimulation('contenido CSV');

    expect(simulateImport.execute).toHaveBeenCalledWith('contenido CSV');
    expect(result).toEqual({
      fileName: 'errores-simulacion.csv',
      csv: [
        'fila,campo,error',
        '3,anio,Año inválido',
        '4,,Error general',
        '',
      ].join('\n'),
    });
  });
});
