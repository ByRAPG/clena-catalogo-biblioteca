import { ServiceUnavailableException } from '@nestjs/common';
import { PendingIamAuthenticator } from './pending-iam.authenticator';

describe('PendingIamAuthenticator', () => {
  it('impide autenticar mientras IAM esté pendiente de conectar', () => {
    expect(() => new PendingIamAuthenticator().authenticate()).toThrow(
      ServiceUnavailableException,
    );
  });
});
