export const RESERVATION_REPOSITORY = Symbol('RESERVATION_REPOSITORY');
export const RESERVATION_CLOCK = Symbol('RESERVATION_CLOCK');
export const RESERVATION_HOURS = Symbol('RESERVATION_HOURS');

/** Máximo de reservas ACTIVAS que puede tener un lector a la vez. */
export const MAX_ACTIVE_RESERVATIONS_PER_READER = 3;

export interface ReservationClock {
  now(): Date;
}

export interface ReservationRecord {
  readonly id: string;
  readonly workId: string;
  readonly workTitle: string;
  readonly copyId: string;
  readonly inventoryCode: string;
  readonly readerId: string;
  readonly status: 'ACTIVA' | 'RECOGIDA' | 'CANCELADA' | 'VENCIDA';
  readonly reservedAt: Date;
  readonly expiresAt: Date;
}

export interface ReservationRepository {
  /**
   * Lector vinculado a la cuenta; lo crea si la cuenta aún no tiene uno. Lanza
   * ReservationAccountInvalidError si la cuenta está inactiva o anonimizada, o
   * si su lector está anonimizado: nunca crea ni devuelve un lector entonces.
   */
  ensureReaderForUser(userId: string): Promise<string>;
  /**
   * Reserva un ejemplar DISPONIBLE y sin reserva de la obra. Lanza
   * WorkNotFoundForReservationError, AlreadyReservedError (el lector ya tiene
   * una reserva activa de la obra), ReservationLimitReachedError (ya tiene el
   * máximo de reservas activas) o NoCopyAvailableError.
   */
  reserveAvailableCopy(input: {
    workId: string;
    readerId: string;
    reservedAt: Date;
    expiresAt: Date;
  }): Promise<ReservationRecord>;
  listActiveByReader(readerId: string): Promise<ReservationRecord[]>;
  /** Cancela una reserva ACTIVA del lector; false si no existe o no es suya. */
  cancel(input: {
    reservationId: string;
    readerId: string;
    now: Date;
  }): Promise<boolean>;
  /** Marca VENCIDA toda reserva ACTIVA con plazo cumplido y dice cuántas. */
  expireDue(now: Date): Promise<number>;
}
