import {
  Availability,
  CopyRecord,
  Location,
  VisibleCopyStatus,
} from './work-summary';

export type VisibleCopy = CopyRecord & { status: VisibleCopyStatus };

export interface AvailabilityAndLocation {
  availability: Availability;
  location: Location | null;
  /** Ejemplares que cuentan (sin los dados de baja), en el orden recibido. */
  copies: VisibleCopy[];
}

/**
 * Regla de disponibilidad y ubicación (HU-03, HU-06).
 * - Los ejemplares BAJA no cuentan en nada.
 * - Disponible si al menos un ejemplar está DISPONIBLE.
 * - Si no, el motivo es PRESTADO si alguno está prestado; si no MANTENIMIENTO;
 *   y SIN_EJEMPLARES cuando no queda ningún ejemplar.
 * - La ubicación es la del primer ejemplar disponible; si no hay, la del primer
 *   ejemplar no dado de baja; null si no hay ejemplares.
 */
export function resolveAvailability(
  allCopies: readonly CopyRecord[],
  hasDigital: boolean,
): AvailabilityAndLocation {
  const copies = allCopies.filter((c): c is VisibleCopy => c.status !== 'BAJA');
  const firstAvailable = copies.find((c) => c.status === 'DISPONIBLE');
  const availableCopies = copies.filter(
    (c) => c.status === 'DISPONIBLE',
  ).length;

  let reason: Availability['reason'] = null;
  if (availableCopies === 0) {
    if (copies.length === 0) reason = 'SIN_EJEMPLARES';
    else if (copies.some((c) => c.status === 'PRESTADO')) reason = 'PRESTADO';
    else reason = 'MANTENIMIENTO';
  }

  const located = firstAvailable ?? copies[0];
  return {
    availability: {
      status: availableCopies > 0 ? 'DISPONIBLE' : 'NO_DISPONIBLE',
      reason,
      availableCopies,
      totalCopies: copies.length,
      hasDigital,
    },
    location: located ? { ...located.location } : null,
    copies,
  };
}
