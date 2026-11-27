import { Inject, Injectable } from '@nestjs/common';
import {
  AlertWorkNotFoundError,
  ReaderNotFoundError,
  ReaderWithoutEmailError,
  WorkAlreadyAvailableError,
} from '../../domain/errors/loan.errors';
import {
  LOAN_ALERTS_REPOSITORY,
  type LoanAlertsRepository,
  type PendingAvailabilityAlert,
} from '../ports/loan-alerts.repository';

/**
 * HU-21: «Avísame cuando esté disponible». El personal lo registra en el
 * mostrador a nombre del lector, que recibe el correo al devolverse un ejemplar.
 */
@Injectable()
export class RequestAvailabilityAlertUseCase {
  constructor(
    @Inject(LOAN_ALERTS_REPOSITORY)
    private readonly alerts: LoanAlertsRepository,
  ) {}

  async execute(
    readerId: string,
    workId: string,
  ): Promise<PendingAvailabilityAlert> {
    const reader = await this.alerts.findReader(readerId);
    if (!reader) throw new ReaderNotFoundError();
    if (!reader.email) throw new ReaderWithoutEmailError();
    const work = await this.alerts.findWork(workId);
    if (!work) throw new AlertWorkNotFoundError();
    if (work.available) throw new WorkAlreadyAvailableError();
    return this.alerts.createAvailabilityAlert(readerId, workId);
  }
}
