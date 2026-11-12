import { createHash, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Env } from '../../../shared/config/env.validation';
import { AccessTokenVerifier } from '../application/ports/access-token-verifier';
import {
  AccessTokenClaims,
  IssuedRefreshToken,
  RefreshTokenClaims,
  TokenService,
} from '../application/ports/token-service';
import { isRole } from '../domain/role';

type TokenTtl = JwtSignOptions['expiresIn'];

/**
 * Access token: JWT con `sub` (usuario) y `role`, firmado con JWT_ACCESS_SECRET.
 * Refresh token: JWT con `sub` y `fam` (familia), firmado con otro secreto y con
 * un `jti` aleatorio para que dos tokens emitidos en el mismo segundo sean distintos.
 */
@Injectable()
export class JwtTokenService implements TokenService, AccessTokenVerifier {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  signAccessToken(claims: AccessTokenClaims): Promise<string> {
    return this.jwt.signAsync(
      { role: claims.role },
      {
        subject: claims.userId,
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_ACCESS_TTL', {
          infer: true,
        }) as TokenTtl,
      },
    );
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
    try {
      const payload = await this.jwt.verifyAsync<{
        sub?: string;
        role?: unknown;
      }>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      });
      if (!payload.sub || !isRole(payload.role)) return null;
      return { userId: payload.sub, role: payload.role };
    } catch {
      return null;
    }
  }

  async signRefreshToken(
    claims: RefreshTokenClaims,
  ): Promise<IssuedRefreshToken> {
    const token = await this.jwt.signAsync(
      { fam: claims.familyId },
      {
        subject: claims.userId,
        jwtid: randomUUID(),
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_REFRESH_TTL', {
          infer: true,
        }) as TokenTtl,
      },
    );
    // La fecha de vencimiento sale del propio token, así no se calcula dos veces.
    const { exp } = this.jwt.decode(token) as { exp: number };
    return { token, expiresAt: new Date(exp * 1000) };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenClaims | null> {
    try {
      const payload = await this.jwt.verifyAsync<{
        sub?: string;
        fam?: string;
      }>(token, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      });
      if (!payload.sub || !payload.fam) return null;
      return { userId: payload.sub, familyId: payload.fam };
    } catch {
      return null;
    }
  }

  /** SHA-256 en hexadecimal: en la base nunca queda el token en claro. */
  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
