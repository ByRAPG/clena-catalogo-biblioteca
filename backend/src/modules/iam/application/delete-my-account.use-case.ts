import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  AccountDeletionNotAllowedError,
  ActiveLoansError,
  InvalidCredentialsError,
  WrongPasswordError,
} from '../domain/iam-errors';
import { CLOCK, Clock } from './ports/clock';
import { PASSWORD_HASHER, PasswordHasher } from './ports/password-hasher';
import {
  READER_ACCOUNT_REPOSITORY,
  ReaderAccountRepository,
} from './ports/reader-account.repository';
import { USER_REPOSITORY, UserRepository } from './ports/user.repository';

/**
 * HU-17: un lector elimina su cuenta confirmando con la contraseña. Se
 * anonimiza (no se borra la fila) para conservar el historial de préstamos.
 */
@Injectable()
export class DeleteMyAccount {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(READER_ACCOUNT_REPOSITORY)
    private readonly accounts: ReaderAccountRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(input: { userId: string; password: string }): Promise<void> {
    const user = await this.users.findById(input.userId);
    if (!user || !user.canLogin()) throw new InvalidCredentialsError();
    if (user.role !== 'READER') throw new AccountDeletionNotAllowedError();
    if (!(await this.hasher.verify(input.password, user.passwordHash))) {
      throw new WrongPasswordError();
    }
    // Las sesiones se revocan dentro de la misma transacción que anonimiza.
    const result = await this.accounts.anonymize({
      userId: user.id,
      anonymizedEmail: `eliminada-${randomUUID()}@anonimo.invalid`,
      now: this.clock.now(),
    });
    if (result === 'has-active-loans') throw new ActiveLoansError();
  }
}
