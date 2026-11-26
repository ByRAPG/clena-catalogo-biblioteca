import {
  CopyOnLoanError,
  CopyReservedError,
  InvalidCopyUpdateError,
} from '../errors/copy.errors';

export type CopyStatus = 'DISPONIBLE' | 'PRESTADO' | 'MANTENIMIENTO' | 'BAJA';

/**
 * Estados que el personal pone a mano. PRESTADO no está: lo pone y lo quita
 * el módulo de préstamos al registrar el préstamo y la devolución.
 */
export const EDITABLE_COPY_STATUSES = [
  'DISPONIBLE',
  'MANTENIMIENTO',
  'BAJA',
] as const;
export type EditableCopyStatus = (typeof EDITABLE_COPY_STATUSES)[number];

export interface CopyUpdateInput {
  shelfId?: string;
  status?: string;
}

/** Situación actual del ejemplar que deciden las reglas de HU-11. */
export interface CopyCirculation {
  status: CopyStatus;
  /** Hay un préstamo sin devolver (returned_at IS NULL). */
  hasActiveLoan: boolean;
  /** Hay una reserva en estado ACTIVA. */
  hasActiveReservation: boolean;
}

/**
 * Cambio pedido sobre un ejemplar (HU-11): estante, estado o ambos.
 * La ubicación siempre se puede cambiar; el estado no, si el ejemplar está en
 * circulación (préstamo o reserva activos).
 */
export class CopyUpdate {
  private constructor(
    public readonly shelfId: string | null,
    public readonly status: EditableCopyStatus | null,
  ) {}

  static create(input: CopyUpdateInput): CopyUpdate {
    const shelfId = input.shelfId?.trim() || null;
    const status = input.status ?? null;
    if (!shelfId && status === null) {
      throw new InvalidCopyUpdateError(
        'Indique el estante o el estado que quiere cambiar',
      );
    }
    if (status !== null && !isEditableStatus(status)) {
      throw new InvalidCopyUpdateError(
        'El estado debe ser DISPONIBLE, MANTENIMIENTO o BAJA',
      );
    }
    return new CopyUpdate(shelfId, status);
  }

  /** Lanza 409 si el cambio de estado choca con un préstamo o reserva activos. */
  assertAllowedFor(copy: CopyCirculation): void {
    if (this.status === null || this.status === copy.status) return;
    if (copy.hasActiveLoan) throw new CopyOnLoanError();
    if (copy.hasActiveReservation) throw new CopyReservedError();
  }
}

function isEditableStatus(value: string): value is EditableCopyStatus {
  return (EDITABLE_COPY_STATUSES as readonly string[]).includes(value);
}
