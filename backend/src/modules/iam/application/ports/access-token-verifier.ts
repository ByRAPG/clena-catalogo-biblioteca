import { AccessTokenClaims } from './token-service';

export const ACCESS_TOKEN_VERIFIER = Symbol('ACCESS_TOKEN_VERIFIER');

/** Lo único que necesitan los guards: saber quién es el dueño de un access token. */
export interface AccessTokenVerifier {
  /** Devuelve null si la firma no es válida o el token expiró. */
  verifyAccessToken(token: string): Promise<AccessTokenClaims | null>;
}
