import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from '../../../shared/errors/all-exceptions.filter';
import { RoomNotFoundError } from '../domain/qr-destination';

/** Traduce `RoomNotFoundError` a 404 con el formato de error único. */
@Catch(RoomNotFoundError)
export class CatalogErrorsFilter implements ExceptionFilter {
  private readonly base = new AllExceptionsFilter();

  catch(exception: RoomNotFoundError, host: ArgumentsHost): void {
    this.base.catch(new NotFoundException(exception.message), host);
  }
}
