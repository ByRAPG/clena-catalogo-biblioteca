import type { CopyCirculation } from '../../domain/entities/copy-update';
import {
  CopyNotFoundError,
  CopyOnLoanError,
  CopyReservedError,
  InvalidCopyUpdateError,
  ShelfNotFoundError,
} from '../../domain/errors/copy.errors';
import type {
  CopyManagementRepository,
  CopyView,
} from '../ports/copy-management.repository';
import { ListShelvesUseCase } from './list-shelves.use-case';
import { UpdateCopyUseCase } from './update-copy.use-case';

const VISTA: CopyView = {
  id: 'c1',
  inventoryCode: 'CLENA-0001-1',
  status: 'DISPONIBLE',
  shelfId: 's2',
  shelf: 'B-02',
  section: 'Historia',
  room: 'Sala Norte',
};

const circulacion = (
  overrides: Partial<CopyCirculation> = {},
): CopyCirculation => ({
  status: 'DISPONIBLE',
  hasActiveLoan: false,
  hasActiveReservation: false,
  ...overrides,
});

const fakeRepo = (
  overrides: Partial<CopyManagementRepository> = {},
): jest.Mocked<CopyManagementRepository> =>
  ({
    findCirculation: jest.fn().mockResolvedValue(circulacion()),
    shelfExists: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(VISTA),
    listShelves: jest.fn().mockResolvedValue([]),
    ...overrides,
  }) as jest.Mocked<CopyManagementRepository>;

describe('UpdateCopyUseCase', () => {
  it('cambia el estante y devuelve el ejemplar con su ubicación', async () => {
    const repo = fakeRepo();
    const result = await new UpdateCopyUseCase(repo).execute('c1', {
      shelfId: 's2',
    });
    expect(repo.shelfExists).toHaveBeenCalledWith('s2');
    expect(repo.update).toHaveBeenCalledWith('c1', { shelfId: 's2' });
    expect(result).toBe(VISTA);
  });

  it('cambia el estado sin consultar estantes', async () => {
    const repo = fakeRepo();
    await new UpdateCopyUseCase(repo).execute('c1', {
      status: 'MANTENIMIENTO',
    });
    expect(repo.shelfExists).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith('c1', {
      status: 'MANTENIMIENTO',
    });
  });

  it('cambia estante y estado a la vez', async () => {
    const repo = fakeRepo();
    await new UpdateCopyUseCase(repo).execute('c1', {
      shelfId: 's2',
      status: 'BAJA',
    });
    expect(repo.update).toHaveBeenCalledWith('c1', {
      shelfId: 's2',
      status: 'BAJA',
    });
  });

  it('responde estante inexistente sin guardar', async () => {
    const repo = fakeRepo({ shelfExists: jest.fn().mockResolvedValue(false) });
    await expect(
      new UpdateCopyUseCase(repo).execute('c1', { shelfId: 'nope' }),
    ).rejects.toBeInstanceOf(ShelfNotFoundError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('responde ejemplar inexistente sin guardar', async () => {
    const repo = fakeRepo({
      findCirculation: jest.fn().mockResolvedValue(null),
    });
    await expect(
      new UpdateCopyUseCase(repo).execute('nope', { status: 'BAJA' }),
    ).rejects.toBeInstanceOf(CopyNotFoundError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('no cambia el estado de un ejemplar con préstamo activo', async () => {
    const repo = fakeRepo({
      findCirculation: jest
        .fn()
        .mockResolvedValue(
          circulacion({ status: 'PRESTADO', hasActiveLoan: true }),
        ),
    });
    await expect(
      new UpdateCopyUseCase(repo).execute('c1', { status: 'MANTENIMIENTO' }),
    ).rejects.toBeInstanceOf(CopyOnLoanError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('sí mueve de estante un ejemplar con préstamo activo', async () => {
    const repo = fakeRepo({
      findCirculation: jest
        .fn()
        .mockResolvedValue(
          circulacion({ status: 'PRESTADO', hasActiveLoan: true }),
        ),
    });
    await new UpdateCopyUseCase(repo).execute('c1', { shelfId: 's2' });
    expect(repo.update).toHaveBeenCalledWith('c1', { shelfId: 's2' });
  });

  it('corrige un PRESTADO importado sin préstamo registrado', async () => {
    const repo = fakeRepo({
      findCirculation: jest
        .fn()
        .mockResolvedValue(circulacion({ status: 'PRESTADO' })),
    });
    await new UpdateCopyUseCase(repo).execute('c1', { status: 'DISPONIBLE' });
    expect(repo.update).toHaveBeenCalledWith('c1', { status: 'DISPONIBLE' });
  });

  it('no cambia el estado de un ejemplar con reserva activa', async () => {
    const repo = fakeRepo({
      findCirculation: jest
        .fn()
        .mockResolvedValue(circulacion({ hasActiveReservation: true })),
    });
    await expect(
      new UpdateCopyUseCase(repo).execute('c1', { status: 'BAJA' }),
    ).rejects.toBeInstanceOf(CopyReservedError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('rechaza un cuerpo vacío antes de consultar', async () => {
    const repo = fakeRepo();
    await expect(
      new UpdateCopyUseCase(repo).execute('c1', {}),
    ).rejects.toBeInstanceOf(InvalidCopyUpdateError);
    expect(repo.findCirculation).not.toHaveBeenCalled();
  });
});

describe('ListShelvesUseCase', () => {
  it('devuelve los estantes del repositorio', async () => {
    const estantes = [
      { id: 's1', code: 'A-01', section: 'Narrativa', room: 'Sala General' },
    ];
    const repo = fakeRepo({
      listShelves: jest.fn().mockResolvedValue(estantes),
    });
    await expect(new ListShelvesUseCase(repo).execute()).resolves.toBe(
      estantes,
    );
  });
});
