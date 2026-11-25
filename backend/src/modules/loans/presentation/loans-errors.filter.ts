import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from '../../../shared/errors/all-exceptions.filter';
import {
  CopyNotAvailableError,
  CopyNotFoundError,
  LoanAlreadyReturnedError,
  LoanDomainError,
  LoanNotFoundError,
  ReaderNotFoundError,
} from '../domain/errors/loan.errors';

/** Traduce errores de dominio del módulo loans al formato HTTP estándar. */
@Catch(LoanDomainError)
export class LoansErrorsFilter implements ExceptionFilter {
  private readonly base = new AllExceptionsFilter();

  catch(exception: LoanDomainError, host: ArgumentsHost): void {
    let httpException: Error;

    if (
      exception instanceof CopyNotFoundError ||
      exception instanceof ReaderNotFoundError ||
      exception instanceof LoanNotFoundError
    ) {
      httpException = new NotFoundException(exception.message);
    } else if (
      exception instanceof CopyNotAvailableError ||
      exception instanceof LoanAlreadyReturnedError
    ) {
      httpException = new ConflictException(exception.message);
    } else {
      httpException = new BadRequestException(exception.message);
    }

    this.base.catch(httpException, host);
  }
}
