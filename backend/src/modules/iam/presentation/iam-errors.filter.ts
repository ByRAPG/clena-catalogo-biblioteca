import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AllExceptionsFilter } from '../../../shared/errors/all-exceptions.filter';
import {
  AccountDeletionNotAllowedError,
  ActiveLoansError,
  CannotDeactivateSelfError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidEmailError,
  InvalidFullNameError,
  InvalidRefreshTokenError,
  PrivacyNotAcceptedError,
  UserNotFoundError,
  WeakPasswordError,
  WrongPasswordError,
} from '../domain/iam-errors';

/**
 * Traduce los errores de IAM: credenciales o sesión inválidas a 401 (una
 * cuenta bloqueada responde igual que una contraseña incorrecta), datos
 * inválidos a 400, conflictos a 409. Delega en el filtro global para
 * conservar el formato de error único.
 */
@Catch(
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  InvalidEmailError,
  InvalidFullNameError,
  WeakPasswordError,
  PrivacyNotAcceptedError,
  EmailAlreadyRegisteredError,
  CannotDeactivateSelfError,
  ActiveLoansError,
  UserNotFoundError,
  WrongPasswordError,
  AccountDeletionNotAllowedError,
)
export class IamErrorsFilter implements ExceptionFilter {
  private readonly base = new AllExceptionsFilter();

  catch(exception: Error, host: ArgumentsHost): void {
    this.base.catch(this.toHttp(exception), host);
  }

  private toHttp(exception: Error): Error {
    const { message } = exception;
    if (
      exception instanceof InvalidCredentialsError ||
      exception instanceof InvalidRefreshTokenError
    ) {
      return new UnauthorizedException(message);
    }
    if (
      exception instanceof InvalidEmailError ||
      exception instanceof InvalidFullNameError ||
      exception instanceof WeakPasswordError ||
      exception instanceof PrivacyNotAcceptedError
    ) {
      return new BadRequestException(message);
    }
    if (exception instanceof UserNotFoundError) {
      return new NotFoundException(message);
    }
    if (
      exception instanceof WrongPasswordError ||
      exception instanceof AccountDeletionNotAllowedError
    ) {
      return new ForbiddenException(message);
    }
    return new ConflictException(message);
  }
}
