import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type {
  IImportAuthenticator,
  ImportPrincipal,
} from '../../application/ports/import-authenticator';

@Injectable()
export class PendingIamAuthenticator implements IImportAuthenticator {
  authenticate(): Promise<ImportPrincipal | null> {
    throw new ServiceUnavailableException(
      'La importación estará disponible cuando se conecte la autenticación del personal',
    );
  }
}
