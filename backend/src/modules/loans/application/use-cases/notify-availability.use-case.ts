import { Inject, Injectable, Logger } from '@nestjs/common';
import { availabilityMessage } from '../../domain/alerts/alert-messages';
import type { LoanClock } from '../ports/clock.port';
import { EMAIL_SENDER, type EmailSender } from '../ports/email-sender.port';
import {
  LOAN_ALERTS_REPOSITORY,
  type LoanAlertsRepository,
} from '../ports/loan-alerts.repository';
import { LOAN_CLOCK } from '../tokens';

export interface DeliverySummary {
  sent: number;
  failed: number;
}

/**
 * HU-21: envía «Ya está disponible» a quien lo pidió, una sola vez por aviso.
 * Con `workId` revisa solo ese libro (se llama al registrar una devolución).
 */
@Injectable()
export class NotifyAvailabilityUseCase {
  private readonly logger = new Logger(NotifyAvailabilityUseCase.name);

  constructor(
    @Inject(LOAN_ALERTS_REPOSITORY)
    private readonly alerts: LoanAlertsRepository,
    @Inject(EMAIL_SENDER) private readonly email: EmailSender,
    @Inject(LOAN_CLOCK) private readonly clock: LoanClock,
  ) {}

  async execute(workId?: string): Promise<DeliverySummary> {
    const summary: DeliverySummary = { sent: 0, failed: 0 };
    const pending = await this.alerts.findDeliverableAvailabilityAlerts(workId);
    for (const alert of pending) {
      if (!alert.reader.email) continue;
      const claimed = await this.alerts.claimAvailabilityAlert(
        alert.id,
        this.clock.now(),
      );
      if (!claimed) continue;
      try {
        await this.email.send(
          availabilityMessage({
            to: alert.reader.email,
            readerName: alert.reader.fullName,
            workTitle: alert.workTitle,
          }),
        );
        summary.sent += 1;
      } catch (error) {
        await this.alerts.releaseAvailabilityAlert(alert.id);
        this.logger.warn(
          `No se pudo enviar el aviso de disponibilidad ${alert.id}: ${String(error)}`,
        );
        summary.failed += 1;
      }
    }
    return summary;
  }
}
