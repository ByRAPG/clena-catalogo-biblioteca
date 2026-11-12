import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type {
  IImportAuthenticator,
  ImportPrincipal,
} from '../../application/ports/import-authenticator';
import { IMPORT_AUTHENTICATOR } from '../../application/tokens';

export interface ImportRequest extends Request {
  importPrincipal: ImportPrincipal;
}

@Injectable()
export class ImportAdminGuard implements CanActivate {
  constructor(
    @Inject(IMPORT_AUTHENTICATOR)
    private readonly authenticator: IImportAuthenticator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ImportRequest>();
    const match = /^Bearer ([^\s]+)$/i.exec(
      request.headers.authorization ?? '',
    );
    if (!match) throw new UnauthorizedException('Debe iniciar sesión');
    const principal = await this.authenticator.authenticate(match[1]);
    if (!principal) throw new UnauthorizedException('La sesión no es válida');
    if (principal.role !== 'ADMIN') {
      throw new ForbiddenException(
        'La importación requiere el rol de administrador',
      );
    }
    request.importPrincipal = principal;
    return true;
  }
}
