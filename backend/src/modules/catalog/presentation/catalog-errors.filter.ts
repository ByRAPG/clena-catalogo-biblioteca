import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from '../../../shared/errors/all-exceptions.filter';
import {
  CopyDomainError,
  CopyNotFoundError,
  CopyOnLoanError,
  CopyReservedError,
  CopyChangedError,
  CopyWorkNotFoundError,
  InventoryCodeTakenError,
} from '../domain/errors/copy.errors';
import { InvalidWorkError } from '../domain/errors/invalid-work.error';
import { RoomNotFoundError } from '../domain/qr-destination';

type CatalogDomainError =
  RoomNotFoundError | InvalidWorkError | CopyDomainError;

/**
 * Traduce los errores de dominio del catálogo con el formato de error único:
 * no encontrado a 404, conflicto de circulación (HU-11) a 409 y el resto a 400.
 */
@Catch(RoomNotFoundError, InvalidWorkError, CopyDomainError)
export class CatalogErrorsFilter implements ExceptionFilter {
  private readonly base = new AllExceptionsFilter();

  catch(exception: CatalogDomainError, host: ArgumentsHost): void {
    this.base.catch(toHttp(exception), host);
  }
}

function toHttp(exception: CatalogDomainError): HttpException {
  if (
    exception instanceof RoomNotFoundError ||
    exception instanceof CopyNotFoundError ||
    exception instanceof CopyWorkNotFoundError
  ) {
    return new NotFoundException(exception.message);
  }
  if (
    exception instanceof CopyOnLoanError ||
    exception instanceof CopyReservedError ||
    exception instanceof CopyChangedError ||
    exception instanceof InventoryCodeTakenError
  ) {
    return new ConflictException(exception.message);
  }
  return new BadRequestException(exception.message);
}
