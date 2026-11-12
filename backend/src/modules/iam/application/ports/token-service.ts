import { Role } from '../../domain/role';

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface AccessTokenClaims {
  userId: string;
  role: Role;
}

export interface RefreshTokenClaims {
  userId: string;
  familyId: string;
}

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
}

export interface TokenService {
  signAccessToken(claims: AccessTokenClaims): Promise<string>;
  signRefreshToken(claims: RefreshTokenClaims): Promise<IssuedRefreshToken>;
  /** Devuelve null si la firma no es válida o el token ya expiró. */
  verifyRefreshToken(token: string): Promise<RefreshTokenClaims | null>;
  hashRefreshToken(token: string): string;
}
