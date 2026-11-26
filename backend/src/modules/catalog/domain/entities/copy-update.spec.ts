import {
  CopyOnLoanError,
  CopyReservedError,
  InvalidCopyUpdateError,
} from '../errors/copy.errors';
import { CopyUpdate, type CopyCirculation } from './copy-update';

const libre: CopyCirculation = {
  status: 'DISPONIBLE',
  hasActiveLoan: false,
  hasActiveReservation: false,
};

describe('CopyUpdate', () => {
  it('acepta solo el estante, solo el estado o ambos', () => {
    expect(CopyUpdate.create({ shelfId: 's1' })).toMatchObject({
      shelfId: 's1',
      status: null,
    });
    expect(CopyUpdate.create({ status: 'MANTENIMIENTO' })).toMatchObject({
      shelfId: null,
      status: 'MANTENIMIENTO',
    });
    expect(CopyUpdate.create({ shelfId: 's1', status: 'BAJA' })).toMatchObject({
      shelfId: 's1',
      status: 'BAJA',
    });
  });

  it('rechaza un cuerpo sin cambios', () => {
    expect(() => CopyUpdate.create({})).toThrow(InvalidCopyUpdateError);
    expect(() => CopyUpdate.create({ shelfId: '  ' })).toThrow(
      InvalidCopyUpdateError,
    );
  });

  it.each(['PRESTADO', 'disponible', 'OTRO'])(
    'rechaza el estado %s',
    (status) => {
      expect(() => CopyUpdate.create({ status })).toThrow(
        InvalidCopyUpdateError,
      );
    },
  );

  it('bloquea el cambio de estado con préstamo activo', () => {
    const update = CopyUpdate.create({ status: 'MANTENIMIENTO' });
    expect(() =>
      update.assertAllowedFor({
        ...libre,
        status: 'PRESTADO',
        hasActiveLoan: true,
      }),
    ).toThrow(CopyOnLoanError);
  });

  it('bloquea el cambio de estado con reserva activa', () => {
    const update = CopyUpdate.create({ status: 'BAJA' });
    expect(() =>
      update.assertAllowedFor({ ...libre, hasActiveReservation: true }),
    ).toThrow(CopyReservedError);
  });

  it('deja corregir un PRESTADO sin préstamo registrado', () => {
    const update = CopyUpdate.create({ status: 'DISPONIBLE' });
    expect(() =>
      update.assertAllowedFor({ ...libre, status: 'PRESTADO' }),
    ).not.toThrow();
  });

  it('deja mover de estante aunque haya préstamo o reserva', () => {
    const update = CopyUpdate.create({ shelfId: 's2' });
    expect(() =>
      update.assertAllowedFor({
        status: 'PRESTADO',
        hasActiveLoan: true,
        hasActiveReservation: true,
      }),
    ).not.toThrow();
  });

  it('no bloquea si el estado pedido es el mismo', () => {
    const update = CopyUpdate.create({ status: 'DISPONIBLE' });
    expect(() =>
      update.assertAllowedFor({ ...libre, hasActiveReservation: true }),
    ).not.toThrow();
  });
});
