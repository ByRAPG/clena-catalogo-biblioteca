import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ACCESS_TOKEN_VERIFIER,
  AccessTokenVerifier,
} from '../../application/ports/access-token-verifier';
import { AccessTokenClaims } from '../../application/ports/token-service';

/** Petición ya autenticada: `auth` trae el usuario y su rol. */
export interface AuthenticatedRequest extends Request {
  auth?: AccessTokenClaims;
}

const BEARER_PATTERN = /^Bearer (\S+)$/i;

/** Exige un access token válido en `Authorization: Bearer <token>`. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(ACCESS_TOKEN_VERIFIER)
    private readonly verifier: AccessTokenVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const match = BEARER_PATTERN.exec(request.headers.authorization ?? '');
    if (!match) throw new UnauthorizedException('Debe iniciar sesión');

    const claims = await this.verifier.verifyAccessToken(match[1]);
    if (!claims) throw new UnauthorizedException('La sesión no es válida');

    request.auth = claims;
    return true;
  }
}
