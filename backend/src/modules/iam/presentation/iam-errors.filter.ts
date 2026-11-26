import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnauthorizedException,
} from '@nestjs/common';
import { AllExceptionsFilter } from '../../../shared/errors/all-exceptions.filter';
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../domain/iam-errors';

/**
 * Traduce los errores de IAM: credenciales o sesión inválidas a 401. Delega en
 * el filtro global para conservar el formato de error único. Una cuenta
 * bloqueada responde igual que una contraseña incorrecta.
 */
@Catch(InvalidCredentialsError, InvalidRefreshTokenError)
export class IamErrorsFilter implements ExceptionFilter {
  private readonly base = new AllExceptionsFilter();

  catch(
    exception: InvalidCredentialsError | InvalidRefreshTokenError,
    host: ArgumentsHost,
  ): void {
    this.base.catch(new UnauthorizedException(exception.message), host);
  }
}
