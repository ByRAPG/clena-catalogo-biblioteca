import { Role } from '../domain/role';
import { User } from '../domain/user.entity';
import { RefreshTokenRepository } from './ports/refresh-token.repository';
import { TokenService } from './ports/token-service';

export interface SessionResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: { name: string; role: Role };
}

/** Emite el par de tokens y guarda el hash del refresh. Lo comparten login y renovación. */
export async function issueSession(
  user: User,
  familyId: string,
  tokens: TokenService,
  refreshTokens: RefreshTokenRepository,
): Promise<SessionResult> {
  const accessToken = await tokens.signAccessToken({
    userId: user.id,
    role: user.role,
  });
  const refresh = await tokens.signRefreshToken({
    userId: user.id,
    familyId,
  });
  await refreshTokens.create({
    userId: user.id,
    tokenHash: tokens.hashRefreshToken(refresh.token),
    familyId,
    expiresAt: refresh.expiresAt,
  });
  return {
    accessToken,
    refreshToken: refresh.token,
    refreshTokenExpiresAt: refresh.expiresAt,
    user: { name: user.fullName, role: user.role },
  };
}
