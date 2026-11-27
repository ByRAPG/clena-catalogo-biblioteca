import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Email } from '../domain/email.vo';
import { parseFullName } from '../domain/full-name';
import { assertPasswordAllowed } from '../domain/password-policy';
import { User } from '../domain/user.entity';
import { PASSWORD_HASHER, PasswordHasher } from './ports/password-hasher';
import { USER_REPOSITORY, UserRepository } from './ports/user.repository';

export interface CreateInitialAdminInput {
  email: string;
  password: string;
  fullName: string;
  /** Permite crear otro administrador aunque ya haya uno activo. */
  allowAdditional?: boolean;
}

export type CreateInitialAdminResult =
  | { status: 'created'; userId: string }
  /** El correo ya tenía cuenta: no se tocó nada (ni contraseña ni rol). */
  | { status: 'already-exists' }
  /** Ya hay un administrador activo y no se pidió crear otro. */
  | { status: 'admin-present' };

@Injectable()
export class CreateInitialAdmin {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
  ) {}

  /** Lanza InvalidEmailError, WeakPasswordError o InvalidFullNameError si los datos no valen. */
  async execute(
    input: CreateInitialAdminInput,
  ): Promise<CreateInitialAdminResult> {
    const email = Email.create(input.email);
    assertPasswordAllowed(input.password, email);
    const fullName = parseFullName(input.fullName);

    if (await this.users.findByEmail(email)) {
      return { status: 'already-exists' };
    }
    if (!input.allowAdditional && (await this.users.existsActiveAdmin())) {
      return { status: 'admin-present' };
    }

    const user = new User({
      id: randomUUID(),
      email,
      passwordHash: await this.hasher.hash(input.password),
      fullName,
      role: 'ADMIN',
      active: true,
      failedLogins: 0,
      lockedUntil: null,
      anonymizedAt: null,
    });
    await this.users.create(user);
    return { status: 'created', userId: user.id };
  }
}
