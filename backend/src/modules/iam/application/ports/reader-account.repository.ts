import { User } from '../../domain/user.entity';

export const READER_ACCOUNT_REPOSITORY = Symbol('READER_ACCOUNT_REPOSITORY');

export interface NewReaderAccount {
  user: User;
  privacyVersion: string;
  consentAt: Date;
}

export interface AccountProfile {
  fullName: string;
  email: string;
  consentAt: Date | null;
  privacyVersion: string | null;
}

export type AnonymizeResult = 'done' | 'has-active-loans';

/** Cuentas de lectores (HU-16 y HU-17): el usuario y su lector vinculado van juntos. */
export interface ReaderAccountRepository {
  /**
   * Crea el usuario READER y su lector vinculado en una sola transacción.
   * Lanza EmailAlreadyRegisteredError si el correo ya existe.
   */
  createReaderAccount(account: NewReaderAccount): Promise<void>;
  getProfile(userId: string): Promise<AccountProfile | null>;
  /**
   * Anonimiza usuario y lector, cancela sus reservas activas y revoca sus
   * sesiones, todo en una transacción. Si tiene un préstamo activo no toca nada.
   */
  anonymize(input: {
    userId: string;
    anonymizedEmail: string;
    now: Date;
  }): Promise<AnonymizeResult>;
}
