import { InvalidFullNameError } from './iam-errors';

export const MAX_FULL_NAME_LENGTH = 120;

/** Recorta y valida el nombre completo de una cuenta. */
export function parseFullName(raw: string): string {
  const fullName = raw.trim().replace(/\s+/g, ' ');
  if (fullName.length === 0) {
    throw new InvalidFullNameError('no puede estar vacío');
  }
  if (fullName.length > MAX_FULL_NAME_LENGTH) {
    throw new InvalidFullNameError(
      `debe tener como máximo ${MAX_FULL_NAME_LENGTH} caracteres`,
    );
  }
  return fullName;
}
