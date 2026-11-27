import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Email } from '../domain/email.vo';
import { parseFullName } from '../domain/full-name';
import {
  EmailAlreadyRegisteredError,
  PrivacyNotAcceptedError,
} from '../domain/iam-errors';
import { assertPasswordAllowed } from '../domain/password-policy';
import { PRIVACY_VERSION } from '../domain/privacy';
import { User } from '../domain/user.entity';
import { CLOCK, Clock } from './ports/clock';
import { PASSWORD_HASHER, PasswordHasher } from './ports/password-hasher';
import {
  READER_ACCOUNT_REPOSITORY,
  ReaderAccountRepository,
} from './ports/reader-account.repository';
import { USER_REPOSITORY, UserRepository } from './ports/user.repository';

export interface RegisterReaderInput {
  fullName: string;
  email: string;
  password: string;
  acceptPrivacy: boolean;
}

/**
 * HU-16: registro público de un lector. Si el correo ya tiene cuenta no se
 * crea nada y el resultado es el mismo que si se hubiera creado: así el
 * registro no sirve para averiguar qué correos existen.
 */
@Injectable()
export class RegisterReader {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(READER_ACCOUNT_REPOSITORY)
    private readonly accounts: ReaderAccountRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(input: RegisterReaderInput): Promise<void> {
    if (input.acceptPrivacy !== true) throw new PrivacyNotAcceptedError();
    const email = Email.create(input.email);
    assertPasswordAllowed(input.password, email);
    const fullName = parseFullName(input.fullName);

    // Se cifra siempre, exista o no el correo, para que el tiempo no lo delate.
    const passwordHash = await this.hasher.hash(input.password);
    if (await this.users.findByEmail(email)) return;

    const user = new User({
      id: randomUUID(),
      email,
      passwordHash,
      fullName,
      role: 'READER',
      active: true,
      failedLogins: 0,
      lockedUntil: null,
      anonymizedAt: null,
    });
    try {
      await this.accounts.createReaderAccount({
        user,
        privacyVersion: PRIVACY_VERSION,
        consentAt: this.clock.now(),
      });
    } catch (error) {
      if (error instanceof EmailAlreadyRegisteredError) return;
      throw error;
    }
  }
}
