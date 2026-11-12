import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AllExceptionsFilter } from '../../../shared/errors/all-exceptions.filter';
import {
  AccountLockedError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../domain/iam-errors';

/**
 * Traduce los errores de IAM: credenciales o sesión inválidas a 401 y cuenta
 * bloqueada a 429 con Retry-After. Delega en el filtro global para conservar
 * el formato de error único.
 */
@Catch(InvalidCredentialsError, InvalidRefreshTokenError, AccountLockedError)
export class IamErrorsFilter implements ExceptionFilter {
  private readonly base = new AllExceptionsFilter();

  catch(
    exception:
      | InvalidCredentialsError
      | InvalidRefreshTokenError
      | AccountLockedError,
    host: ArgumentsHost,
  ): void {
    if (exception instanceof AccountLockedError) {
      host
        .switchToHttp()
        .getResponse<Response>()
        .setHeader('Retry-After', String(exception.retryAfterSeconds));
      this.base.catch(
        new HttpException(exception.message, HttpStatus.TOO_MANY_REQUESTS),
        host,
      );
      return;
    }
    this.base.catch(new UnauthorizedException(exception.message), host);
  }
}
