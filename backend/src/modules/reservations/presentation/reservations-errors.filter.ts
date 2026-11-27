import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from '../../../shared/errors/all-exceptions.filter';
import {
  ReservationDomainError,
  ReservationNotFoundError,
  WorkNotFoundForReservationError,
} from '../domain/reservation.errors';

/** Traduce los errores de dominio de reservas al formato HTTP estándar. */
@Catch(ReservationDomainError)
export class ReservationsErrorsFilter implements ExceptionFilter {
  private readonly base = new AllExceptionsFilter();

  catch(exception: ReservationDomainError, host: ArgumentsHost): void {
    const http =
      exception instanceof ReservationNotFoundError ||
      exception instanceof WorkNotFoundForReservationError
        ? new NotFoundException(exception.message)
        : new ConflictException(exception.message);
    this.base.catch(http, host);
  }
}
