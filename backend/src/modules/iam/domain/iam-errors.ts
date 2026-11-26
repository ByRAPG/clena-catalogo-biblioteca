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
