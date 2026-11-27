import { NewCopy } from '../../domain/entities/new-copy';
import {
  CopyWorkNotFoundError,
  InvalidNewCopyError,
  InventoryCodeTakenError,
  ShelfNotFoundError,
} from '../../domain/errors/copy.errors';
import type {
  CopyManagementRepository,
  CopyView,
} from '../ports/copy-management.repository';
import { RegisterCopyUseCase } from './register-copy.use-case';

const VISTA: CopyView = {
  id: 'c9',
  inventoryCode: 'CLENA-0042-1',
  status: 'DISPONIBLE',
  shelfId: 's1',
  shelf: 'A-01',
  section: 'Narrativa',
  room: 'Sala General',
};

const fakeRepo = (
  overrides: Partial<CopyManagementRepository> = {},
): jest.Mocked<CopyManagementRepository> =>
  ({
    workExists: jest.fn().mockResolvedValue(true),
    shelfExists: jest.fn().mockResolvedValue(true),
    inventoryCodeExists: jest.fn().mockResolvedValue(false),
    create: jest.fn().mockResolvedValue(VISTA),
    ...overrides,
  }) as jest.Mocked<CopyManagementRepository>;

const INPUT = { inventoryCode: 'CLENA-0042-1', shelfId: 's1' };

describe('RegisterCopyUseCase', () => {
  it('registra el ejemplar en el libro y devuelve su ubicación', async () => {
    const repo = fakeRepo();
    await expect(
      new RegisterCopyUseCase(repo).execute('w1', INPUT),
    ).resolves.toBe(VISTA);
    const [workId, copy] = repo.create.mock.calls[0];
    expect(workId).toBe('w1');
    expect(copy).toBeInstanceOf(NewCopy);
    expect(copy.status).toBe('DISPONIBLE');
  });

  it('responde libro inexistente sin guardar', async () => {
    const repo = fakeRepo({ workExists: jest.fn().mockResolvedValue(false) });
    await expect(
      new RegisterCopyUseCase(repo).execute('w0', INPUT),
    ).rejects.toBeInstanceOf(CopyWorkNotFoundError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('responde estante inexistente sin guardar', async () => {
    const repo = fakeRepo({ shelfExists: jest.fn().mockResolvedValue(false) });
    await expect(
      new RegisterCopyUseCase(repo).execute('w1', INPUT),
    ).rejects.toBeInstanceOf(ShelfNotFoundError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('no duplica un código de inventario existente', async () => {
    const repo = fakeRepo({
      inventoryCodeExists: jest.fn().mockResolvedValue(true),
    });
    await expect(
      new RegisterCopyUseCase(repo).execute('w1', INPUT),
    ).rejects.toBeInstanceOf(InventoryCodeTakenError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('valida los datos antes de consultar', async () => {
    const repo = fakeRepo();
    await expect(
      new RegisterCopyUseCase(repo).execute('w1', {
        inventoryCode: '',
        shelfId: 's1',
      }),
    ).rejects.toBeInstanceOf(InvalidNewCopyError);
    expect(repo.workExists).not.toHaveBeenCalled();
  });
});
