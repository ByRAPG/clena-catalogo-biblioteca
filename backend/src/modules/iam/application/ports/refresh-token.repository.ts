import { RefreshToken } from '../../domain/refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface NewRefreshToken {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
}

export interface RefreshTokenRepository {
  create(token: NewRefreshToken): Promise<void>;
  findByHash(tokenHash: string): Promise<RefreshToken | null>;
  /**
   * Revoca el token solo si seguía activo y dice si lo logró. Si devuelve
   * false, otra petición ya lo usó: se trata como reutilización.
   */
  revokeIfActive(id: string, revokedAt: Date): Promise<boolean>;
  revokeFamily(familyId: string, revokedAt: Date): Promise<void>;
}
