import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Email } from '../domain/email.vo';
import { parseFullName } from '../domain/full-name';
import { EmailAlreadyRegisteredError } from '../domain/iam-errors';
import { assertPasswordAllowed } from '../domain/password-policy';
import { User } from '../domain/user.entity';
import { PASSWORD_HASHER, PasswordHasher } from './ports/password-hasher';
import { USER_REPOSITORY, UserRepository } from './ports/user.repository';

export interface CreateStaffUserInput {
  fullName: string;
  email: string;
  /** Contraseña inicial; debe cumplir la política. Nunca se registra en logs. */
  password: string;
}

/** HU-18: un administrador crea una cuenta de personal (rol STAFF). */
@Injectable()
export class CreateStaffUser {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  /** Lanza InvalidEmailError, WeakPasswordError, InvalidFullNameError o EmailAlreadyRegisteredError. */
  async execute(input: CreateStaffUserInput): Promise<{ id: string }> {
    const email = Email.create(input.email);
    assertPasswordAllowed(input.password, email);
    const fullName = parseFullName(input.fullName);
    // Quien llama es un administrador autenticado: aquí sí se informa del duplicado.
    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyRegisteredError();
    }
    const user = new User({
      id: randomUUID(),
      email,
      passwordHash: await this.hasher.hash(input.password),
      fullName,
      role: 'STAFF',
      active: true,
      failedLogins: 0,
      lockedUntil: null,
      anonymizedAt: null,
    });
    await this.users.create(user);
    return { id: user.id };
  }
}
