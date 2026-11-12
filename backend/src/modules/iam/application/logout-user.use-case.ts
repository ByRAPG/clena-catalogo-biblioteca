import { Inject, Injectable } from '@nestjs/common';
import { CLOCK, Clock } from './ports/clock';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepository,
} from './ports/refresh-token.repository';
import { TOKEN_SERVICE, TokenService } from './ports/token-service';

@Injectable()
export class LogoutUser {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Cerrar sesión nunca falla: sin cookie o con un token desconocido no hay nada que revocar. */
  async execute(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const stored = await this.refreshTokens.findByHash(
      this.tokens.hashRefreshToken(refreshToken),
    );
    if (!stored) return;
    // Se revoca la familia completa: esa sesión no puede renovarse más.
    await this.refreshTokens.revokeFamily(stored.familyId, this.clock.now());
  }
}
