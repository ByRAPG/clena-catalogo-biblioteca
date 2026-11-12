import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Email } from '../domain/email.vo';
import {
  AccountLockedError,
  InvalidCredentialsError,
  InvalidEmailError,
} from '../domain/iam-errors';
import { CLOCK, Clock } from './ports/clock';
import { PASSWORD_HASHER, PasswordHasher } from './ports/password-hasher';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepository,
} from './ports/refresh-token.repository';
import { TOKEN_SERVICE, TokenService } from './ports/token-service';
import { USER_REPOSITORY, UserRepository } from './ports/user.repository';
import { SessionResult, issueSession } from './session';

export interface LoginInput {
  email: string;
  password: string;
}

@Injectable()
export class LoginUser {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(input: LoginInput): Promise<SessionResult> {
    const now = this.clock.now();
    const user = await this.users.findByEmail(this.parseEmail(input.email));

    // Correo inexistente o cuenta inactiva: mismo error que una contraseña mala.
    if (!user || !user.canLogin()) throw new InvalidCredentialsError();

    // Con la cuenta bloqueada ni siquiera se revisa la contraseña.
    if (user.isLockedAt(now)) {
      throw new AccountLockedError(user.secondsUntilUnlock(now));
    }

    const passwordMatches = await this.hasher.verify(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      user.registerFailedLogin(now);
      await this.users.save(user);
      // El quinto intento fallido ya responde como bloqueado.
      if (user.isLockedAt(now)) {
        throw new AccountLockedError(user.secondsUntilUnlock(now));
      }
      throw new InvalidCredentialsError();
    }

    user.registerSuccessfulLogin();
    await this.users.save(user);

    // Cada login abre una familia nueva de refresh tokens.
    return issueSession(user, randomUUID(), this.tokens, this.refreshTokens);
  }

  /** Un correo mal formado no puede existir: se responde igual que uno desconocido. */
  private parseEmail(raw: string): Email {
    try {
      return Email.create(raw);
    } catch (error) {
      if (error instanceof InvalidEmailError) {
        throw new InvalidCredentialsError();
      }
      throw error;
    }
  }
}
