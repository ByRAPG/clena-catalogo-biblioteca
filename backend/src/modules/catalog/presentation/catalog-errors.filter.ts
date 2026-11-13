import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from '../../../shared/errors/all-exceptions.filter';
import { InvalidWorkError } from '../domain/errors/invalid-work.error';
import { RoomNotFoundError } from '../domain/qr-destination';

/**
 * Traduce los errores de dominio del catálogo con el formato de error único:
 * `RoomNotFoundError` a 404 e `InvalidWorkError` (HU-10) a 400.
 */
@Catch(RoomNotFoundError, InvalidWorkError)
export class CatalogErrorsFilter implements ExceptionFilter {
  private readonly base = new AllExceptionsFilter();

  catch(
    exception: RoomNotFoundError | InvalidWorkError,
    host: ArgumentsHost,
  ): void {
    const http =
      exception instanceof InvalidWorkError
        ? new BadRequestException(exception.message)
        : new NotFoundException(exception.message);
    this.base.catch(http, host);
  }
}
