import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from '../../../shared/errors/all-exceptions.filter';
import {
  InvalidSearchCriteriaError,
  WorkNotFoundError,
} from '../domain/search-errors';

/**
 * Traduce los errores de dominio de búsqueda a 400/404 y delega en el filtro
 * global para conservar el formato de error único.
 */
@Catch(InvalidSearchCriteriaError, WorkNotFoundError)
export class SearchErrorsFilter implements ExceptionFilter {
  private readonly base = new AllExceptionsFilter();

  catch(
    exception: InvalidSearchCriteriaError | WorkNotFoundError,
    host: ArgumentsHost,
  ): void {
    const http =
      exception instanceof WorkNotFoundError
        ? new NotFoundException(exception.message)
        : new BadRequestException(exception.message);
    this.base.catch(http, host);
  }
}
