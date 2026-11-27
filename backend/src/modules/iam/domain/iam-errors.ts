export const INVALID_CREDENTIALS_MESSAGE = 'Correo o contraseña incorrectos';

export class InvalidEmailError extends Error {
  constructor(value: string) {
    super(`El correo «${value}» no es válido`);
    this.name = 'InvalidEmailError';
  }
}

/** Mismo error y mismo mensaje si falla el correo o la contraseña. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super(INVALID_CREDENTIALS_MESSAGE);
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('La sesión no es válida o expiró. Inicia sesión de nuevo.');
    this.name = 'InvalidRefreshTokenError';
  }
}

/** La contraseña no cumple la política; el mensaje nunca incluye la contraseña. */
export class WeakPasswordError extends Error {
  constructor(reason: string) {
    super(`La contraseña no es válida: ${reason}`);
    this.name = 'WeakPasswordError';
  }
}

export class InvalidFullNameError extends Error {
  constructor(reason: string) {
    super(`El nombre no es válido: ${reason}`);
    this.name = 'InvalidFullNameError';
  }
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('Ya existe una cuenta con ese correo');
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super('No se encontró la cuenta indicada');
    this.name = 'UserNotFoundError';
  }
}

export class CannotDeactivateSelfError extends Error {
  constructor() {
    super('No puede desactivar su propia cuenta');
    this.name = 'CannotDeactivateSelfError';
  }
}

export class PrivacyNotAcceptedError extends Error {
  constructor() {
    super('Debe aceptar el tratamiento de sus datos para crear la cuenta');
    this.name = 'PrivacyNotAcceptedError';
  }
}

export class ActiveLoansError extends Error {
  constructor() {
    super('Devuelva el libro primero: tiene un préstamo activo');
    this.name = 'ActiveLoansError';
  }
}

/** La contraseña de confirmación no coincide; responde 403 (no 401: la sesión sigue siendo válida). */
export class WrongPasswordError extends Error {
  constructor() {
    super('La contraseña no es correcta');
    this.name = 'WrongPasswordError';
  }
}

export class AccountDeletionNotAllowedError extends Error {
  constructor() {
    super(
      'Las cuentas del personal se desactivan desde la gestión de usuarios',
    );
    this.name = 'AccountDeletionNotAllowedError';
  }
}
