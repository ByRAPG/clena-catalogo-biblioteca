import { AccessTokenVerifier } from '../../../iam/application/ports/access-token-verifier';
import { IamImportAuthenticator } from './iam-import.authenticator';

const verifierReturning = (
  claims: { userId: string; role: 'ADMIN' | 'STAFF' | 'READER' } | null,
): AccessTokenVerifier => ({
  verifyAccessToken: () => Promise.resolve(claims),
});

describe('IamImportAuthenticator', () => {
  it('convierte un access token válido en el usuario y su rol', async () => {
    const authenticator = new IamImportAuthenticator(
      verifierReturning({ userId: 'u1', role: 'ADMIN' }),
    );
    await expect(authenticator.authenticate('token')).resolves.toEqual({
      userId: 'u1',
      role: 'ADMIN',
    });
  });

  it('devuelve null si el token no es válido', async () => {
    const authenticator = new IamImportAuthenticator(verifierReturning(null));
    await expect(authenticator.authenticate('token')).resolves.toBeNull();
  });
});
