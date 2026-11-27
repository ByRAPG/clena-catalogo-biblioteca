export class ReservationDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class WorkNotFoundForReservationError extends ReservationDomainError {
  constructor() {
    super('No se encontró la obra indicada');
  }
}

/** Ningún ejemplar de la obra está disponible y sin reserva. */
export class NoCopyAvailableError extends ReservationDomainError {
  constructor() {
    super('No hay ejemplares disponibles para reservar en este momento');
  }
}

export class AlreadyReservedError extends ReservationDomainError {
  constructor() {
    super('Ya tiene una reserva activa de esta obra');
  }
}

export class ReservationNotFoundError extends ReservationDomainError {
  constructor() {
    super('No se encontró una reserva activa con ese identificador');
  }
}
