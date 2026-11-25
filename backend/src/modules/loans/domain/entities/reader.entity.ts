import { InvalidReaderError } from '../errors/loan.errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface NewReaderInput {
  fullName: string;
  documentId?: string | null;
  email?: string | null;
  phone?: string | null;
}

/** Datos validados para registrar un lector de mostrador (sin cuenta). */
export class NewReader {
  private constructor(
    readonly fullName: string,
    readonly documentId: string | null,
    readonly email: string | null,
    readonly phone: string | null,
  ) {}

  static create(input: NewReaderInput): NewReader {
    const fullName = input.fullName.trim().replace(/\s+/g, ' ');
    if (fullName.length < 2) {
      throw new InvalidReaderError(
        'fullName',
        'El nombre del lector debe tener al menos 2 caracteres',
      );
    }
    if (fullName.length > 150) {
      throw new InvalidReaderError(
        'fullName',
        'El nombre del lector no puede superar los 150 caracteres',
      );
    }

    const documentId = normalizeOptional(input.documentId);
    if (documentId && documentId.length > 40) {
      throw new InvalidReaderError(
        'documentId',
        'El documento no puede superar los 40 caracteres',
      );
    }

    const rawEmail = normalizeOptional(input.email);
    const email = rawEmail ? rawEmail.toLowerCase() : null;
    if (email && (email.length > 254 || !EMAIL_PATTERN.test(email))) {
      throw new InvalidReaderError(
        'email',
        'El correo del lector no tiene un formato válido',
      );
    }

    const phone = normalizeOptional(input.phone);
    if (phone && phone.length > 30) {
      throw new InvalidReaderError(
        'phone',
        'El teléfono no puede superar los 30 caracteres',
      );
    }

    return new NewReader(fullName, documentId, email, phone);
  }
}

function normalizeOptional(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
