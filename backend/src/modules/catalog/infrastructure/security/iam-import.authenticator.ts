import { Inject, Injectable } from '@nestjs/common';
import {
  ACCESS_TOKEN_VERIFIER,
  AccessTokenVerifier,
} from '../../../iam/application/ports/access-token-verifier';
import type {
  IImportAuthenticator,
  ImportPrincipal,
} from '../../application/ports/import-authenticator';

/** Conecta la importación CSV con el login real (reemplaza a PendingIamAuthenticator). */
@Injectable()
export class IamImportAuthenticator implements IImportAuthenticator {
  constructor(
    @Inject(ACCESS_TOKEN_VERIFIER)
    private readonly verifier: AccessTokenVerifier,
  ) {}

  async authenticate(accessToken: string): Promise<ImportPrincipal | null> {
    const claims = await this.verifier.verifyAccessToken(accessToken);
    return claims ? { userId: claims.userId, role: claims.role } : null;
  }
}
