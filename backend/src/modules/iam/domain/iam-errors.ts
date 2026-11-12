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

/** La cuenta está bloqueada; `retryAfterSeconds` alimenta la cabecera Retry-After. */
export class AccountLockedError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super('Acceso bloqueado por demasiados intentos fallidos');
    this.name = 'AccountLockedError';
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('La sesión no es válida o expiró. Inicia sesión de nuevo.');
    this.name = 'InvalidRefreshTokenError';
  }
}
