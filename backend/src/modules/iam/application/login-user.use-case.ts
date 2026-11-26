import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Email } from '../domain/email.vo';
import {
  InvalidCredentialsError,
  InvalidEmailError,
} from '../domain/iam-errors';
import { MAX_FAILED_LOGINS, lockExpiryFrom } from '../domain/user.entity';
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
  /**
   * Hash ficticio, calculado una sola vez al arrancar con el mismo algoritmo y
   * parámetros que los hashes reales. Se verifica cuando no hay una cuenta que
   * comparar, para que responder tarde lo mismo exista o no el correo.
   */
  private readonly dummyHash: Promise<string>;

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {
    this.dummyHash = this.hasher.hash(randomUUID());
    // Si calcular el hash fallara, no debe tumbar el proceso por una promesa sin
    // atender: el error igual saldrá en el primer login con un correo inexistente.
    this.dummyHash.catch(() => undefined);
  }

  async execute(input: LoginInput): Promise<SessionResult> {
    const now = this.clock.now();
    const user = await this.users.findByEmail(this.parseEmail(input.email));

    // Correo inexistente o cuenta inactiva: se hace igual el trabajo costoso de
    // verificar un hash, para que el tiempo de respuesta no revele si existe.
    if (!user || !user.canLogin()) {
      await this.hasher.verify(input.password, await this.dummyHash);
      throw new InvalidCredentialsError();
    }

    // La contraseña se verifica siempre, también con la cuenta bloqueada: así
    // una cuenta bloqueada no responde más rápido que una que no lo está.
    const passwordMatches = await this.hasher.verify(
      input.password,
      user.passwordHash,
    );

    // Bloqueada: mismo 401 genérico, aunque la contraseña sea la correcta, y
    // sin sumar intentos (no se alarga el bloqueo). No se revela ni el bloqueo
    // ni cuánto falta, porque eso confirmaría que la cuenta existe.
    if (user.isLockedAt(now)) throw new InvalidCredentialsError();

    if (!passwordMatches) {
      // El contador sube en la base de datos y el bloqueo se decide con el
      // valor que esta devuelve, no con uno leído antes por esta petición.
      const failedLogins = await this.users.incrementFailedLogins(user.id);
      if (failedLogins >= MAX_FAILED_LOGINS) {
        await this.users.lockAccount(user.id, lockExpiryFrom(now));
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
