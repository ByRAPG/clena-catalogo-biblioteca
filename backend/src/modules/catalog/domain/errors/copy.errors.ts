/** Errores de dominio al editar un ejemplar (HU-11). */
export class CopyDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** 404: el ejemplar no existe. */
export class CopyNotFoundError extends CopyDomainError {
  constructor() {
    super('No existe el ejemplar indicado');
  }
}

/** 400: el cuerpo no pide ningún cambio o pide un estado no editable. */
export class InvalidCopyUpdateError extends CopyDomainError {}

/** 400: el estante de destino no existe. */
export class ShelfNotFoundError extends CopyDomainError {
  constructor() {
    super('El estante no existe');
  }
}

/** 409: hay un préstamo activo; el estado lo maneja el módulo de préstamos. */
export class CopyOnLoanError extends CopyDomainError {
  constructor() {
    super('El ejemplar está prestado; regístrelo como devuelto primero');
  }
}

/**
 * 409: el estado del ejemplar cambió entre la comprobación y el guardado (por
 * ejemplo, se registró un préstamo en ese instante).
 */
export class CopyChangedError extends CopyDomainError {
  constructor() {
    super(
      'El ejemplar cambió mientras se editaba (por ejemplo, se prestó). Vuelva a cargarlo e intente de nuevo',
    );
  }
}

/** 409: hay una reserva activa sobre el ejemplar. */
export class CopyReservedError extends CopyDomainError {
  constructor() {
    super(
      'El ejemplar tiene una reserva activa; entréguelo o cancele la reserva primero',
    );
  }
}
