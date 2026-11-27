export type UnavailableCopyReason =
  'PRESTADO' | 'MANTENIMIENTO' | 'BAJA' | 'RESERVADO';

const UNAVAILABLE_COPY_MESSAGES: Record<UnavailableCopyReason, string> = {
  PRESTADO: 'El ejemplar ya se encuentra prestado',
  MANTENIMIENTO: 'El ejemplar está en mantenimiento y no se puede prestar',
  BAJA: 'El ejemplar está dado de baja y no se puede prestar',
  RESERVADO: 'El ejemplar tiene una reserva activa y no se puede prestar',
};

export class LoanDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class CopyNotFoundError extends LoanDomainError {
  constructor(identifier?: string) {
    super(
      identifier
        ? `No se encontró el ejemplar «${identifier}»`
        : 'No se encontró el ejemplar indicado',
    );
  }
}

export class CopyNotAvailableError extends LoanDomainError {
  readonly reason: UnavailableCopyReason;

  constructor(reason: UnavailableCopyReason) {
    super(UNAVAILABLE_COPY_MESSAGES[reason]);
    this.reason = reason;
  }
}

export class ReaderNotFoundError extends LoanDomainError {
  constructor() {
    super('No se encontró el lector indicado');
  }
}

export class InvalidReaderError extends LoanDomainError {
  readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.field = field;
  }
}

export class LoanNotFoundError extends LoanDomainError {
  constructor() {
    super('No se encontró el préstamo indicado');
  }
}

export class LoanAlreadyReturnedError extends LoanDomainError {
  constructor() {
    super('El préstamo ya fue devuelto anteriormente');
  }
}

export class InvalidLoanDurationError extends LoanDomainError {
  constructor(minDays: number, maxDays: number) {
    super(
      `El plazo del préstamo debe ser un número entero entre ${minDays} y ${maxDays} días`,
    );
  }
}

export class InvalidLoanRequestError extends LoanDomainError {
  constructor(message: string) {
    super(message);
  }
}

/** 404: la obra del aviso de disponibilidad no existe (HU-21). */
export class AlertWorkNotFoundError extends LoanDomainError {
  constructor() {
    super('No se encontró el libro indicado');
  }
}

/** 400: el aviso se envía por correo y el lector no tiene uno (HU-21). */
export class ReaderWithoutEmailError extends LoanDomainError {
  constructor() {
    super(
      'El lector no tiene correo registrado; agréguelo para poder avisarle',
    );
  }
}

/** 409: el libro ya tiene un ejemplar disponible (HU-21). */
export class WorkAlreadyAvailableError extends LoanDomainError {
  constructor() {
    super('El libro ya tiene un ejemplar disponible; puede prestarlo ahora');
  }
}

/** 409: ya hay un aviso pendiente para ese lector y ese libro (HU-21). */
export class AvailabilityAlertPendingError extends LoanDomainError {
  constructor() {
    super('Este lector ya tiene un aviso pendiente para ese libro');
  }
}
