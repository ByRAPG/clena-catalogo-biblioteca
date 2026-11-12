import { Inject, Injectable } from '@nestjs/common';
import { InvalidRefreshTokenError } from '../domain/iam-errors';
import { CLOCK, Clock } from './ports/clock';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepository,
} from './ports/refresh-token.repository';
import { TOKEN_SERVICE, TokenService } from './ports/token-service';
import { USER_REPOSITORY, UserRepository } from './ports/user.repository';
import { SessionResult, issueSession } from './session';

@Injectable()
export class RefreshSession {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(refreshToken: string): Promise<SessionResult> {
    const now = this.clock.now();

    const claims = await this.tokens.verifyRefreshToken(refreshToken);
    const stored = await this.refreshTokens.findByHash(
      this.tokens.hashRefreshToken(refreshToken),
    );
    if (!claims || !stored || claims.userId !== stored.userId) {
      throw new InvalidRefreshTokenError();
    }

    // Un token ya revocado solo vuelve a aparecer si alguien lo copió:
    // se cierra toda la familia, incluido el token vigente.
    if (stored.isRevoked()) {
      await this.refreshTokens.revokeFamily(stored.familyId, now);
      throw new InvalidRefreshTokenError();
    }
    if (stored.isExpired(now)) throw new InvalidRefreshTokenError();

    const user = await this.users.findById(stored.userId);
    if (!user || !user.canLogin()) {
      await this.refreshTokens.revokeFamily(stored.familyId, now);
      throw new InvalidRefreshTokenError();
    }

    // Rotación: el token usado se revoca y se emite uno nuevo en la misma familia.
    const wasActive = await this.refreshTokens.revokeIfActive(stored.id, now);
    if (!wasActive) {
      await this.refreshTokens.revokeFamily(stored.familyId, now);
      throw new InvalidRefreshTokenError();
    }

    return issueSession(user, stored.familyId, this.tokens, this.refreshTokens);
  }
}
