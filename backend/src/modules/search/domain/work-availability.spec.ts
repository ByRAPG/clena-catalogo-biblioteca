import { resolveAvailability } from './work-availability';
import { CopyRecord, CopyStatus } from './work-summary';

const copy = (
  inventoryCode: string,
  status: CopyStatus,
  shelf = 'A-01',
): CopyRecord => ({
  inventoryCode,
  status,
  location: { room: 'Sala 1', section: 'Sec', shelf },
});

describe('resolveAvailability', () => {
  it('marca disponible y toma la ubicación del primer ejemplar disponible', () => {
    const r = resolveAvailability(
      [copy('1', 'PRESTADO', 'P-1'), copy('2', 'DISPONIBLE', 'D-1')],
      false,
    );
    expect(r.availability).toEqual({
      status: 'DISPONIBLE',
      reason: null,
      availableCopies: 1,
      totalCopies: 2,
      hasDigital: false,
    });
    expect(r.location?.shelf).toBe('D-1');
  });

  it('sin disponibles el motivo es PRESTADO si alguno está prestado', () => {
    const r = resolveAvailability(
      [copy('1', 'MANTENIMIENTO'), copy('2', 'PRESTADO')],
      false,
    );
    expect(r.availability.status).toBe('NO_DISPONIBLE');
    expect(r.availability.reason).toBe('PRESTADO');
  });

  it('sin prestados el motivo es MANTENIMIENTO y la ubicación es la del primero', () => {
    const r = resolveAvailability([copy('1', 'MANTENIMIENTO', 'M-1')], true);
    expect(r.availability.reason).toBe('MANTENIMIENTO');
    expect(r.availability.hasDigital).toBe(true);
    expect(r.location?.shelf).toBe('M-1');
  });

  it('ignora los ejemplares BAJA en todo', () => {
    const r = resolveAvailability(
      [copy('1', 'BAJA', 'B-1'), copy('2', 'PRESTADO', 'P-1')],
      false,
    );
    expect(r.availability.totalCopies).toBe(1);
    expect(r.copies.map((c) => c.inventoryCode)).toEqual(['2']);
    expect(r.location?.shelf).toBe('P-1');
  });

  it('sin ejemplares (o solo de baja) es SIN_EJEMPLARES y sin ubicación', () => {
    for (const copies of [[], [copy('1', 'BAJA')]]) {
      const r = resolveAvailability(copies, false);
      expect(r.availability).toMatchObject({
        status: 'NO_DISPONIBLE',
        reason: 'SIN_EJEMPLARES',
        availableCopies: 0,
        totalCopies: 0,
      });
      expect(r.location).toBeNull();
    }
  });
});
