import { InvalidEmailError } from './iam-errors';

const MAX_EMAIL_LENGTH = 254;
// Forma básica texto@dominio.ext; la validación fina la hace el DTO.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Correo siempre en minúsculas y sin espacios, como se guarda en la base. */
export class Email {
  private constructor(readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (
      normalized.length > MAX_EMAIL_LENGTH ||
      !EMAIL_PATTERN.test(normalized)
    ) {
      throw new InvalidEmailError(raw);
    }
    return new Email(normalized);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
