import { Email } from './email.vo';
import { WeakPasswordError } from './iam-errors';

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

// shortcut: lista corta de las más usadas; ampliar o usar una lista externa si hace falta.
const COMMON_PASSWORDS = new Set([
  'password1234',
  'password12345',
  '123456789012',
  '1234567890123',
  'qwertyuiop12',
  'qwerty123456',
  'administrador',
  'administrator',
  'contrasena123',
  'contraseña123',
  'iloveyou1234',
  'letmein12345',
  'welcome12345',
  'abcdefghijkl',
  'abcd12345678',
]);

/**
 * Política mínima de contraseñas para cuentas que se crean fuera del login
 * (por ejemplo, el primer administrador): entre 12 y 128 caracteres y distinta
 * del correo de la cuenta.
 */
export function assertPasswordAllowed(password: string, email: Email): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new WeakPasswordError(
      `debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
    );
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new WeakPasswordError(
      `debe tener como máximo ${MAX_PASSWORD_LENGTH} caracteres`,
    );
  }
  if (password.trim().toLowerCase() === email.value) {
    throw new WeakPasswordError('no puede ser igual al correo');
  }
  if (COMMON_PASSWORDS.has(password.trim().toLowerCase())) {
    throw new WeakPasswordError('es una contraseña demasiado común');
  }
}
