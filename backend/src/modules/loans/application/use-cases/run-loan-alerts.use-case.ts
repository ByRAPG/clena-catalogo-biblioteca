import { Inject, Injectable } from '@nestjs/common';
import { dueReminderMessage } from '../../domain/alerts/alert-messages';
import { classifyDueDate, dueSoonLimit } from '../../domain/alerts/due-alert';
import type { LoanClock } from '../ports/clock.port';
import { EMAIL_SENDER, type EmailSender } from '../ports/email-sender.port';
import {
  LOAN_ALERTS_REPOSITORY,
  type LoanAlertsRepository,
} from '../ports/loan-alerts.repository';
import { LOAN_CLOCK } from '../tokens';
import {
  NotifyAvailabilityUseCase,
  type DeliverySummary,
} from './notify-availability.use-case';

export const NO_EMAIL_ERROR = 'El lector no tiene correo registrado';

export interface LoanAlertsRunSummary {
  reminders: DeliverySummary & { withoutEmail: number; alreadySent: number };
  availability: DeliverySummary;
}

/**
 * HU-21: revisión diaria. Crea un aviso por préstamo y tipo (por vencer o
 * vencido) y manda el correo una sola vez, aunque la revisión corra varias
 * veces el mismo día. También envía los avisos de disponibilidad pendientes.
 */
@Injectable()
export class RunLoanAlertsUseCase {
  constructor(
    @Inject(LOAN_ALERTS_REPOSITORY)
    private readonly alerts: LoanAlertsRepository,
    @Inject(EMAIL_SENDER) private readonly email: EmailSender,
    @Inject(LOAN_CLOCK) private readonly clock: LoanClock,
    private readonly availability: NotifyAvailabilityUseCase,
  ) {}

  async execute(): Promise<LoanAlertsRunSummary> {
    const now = this.clock.now();
    const reminders = {
      sent: 0,
      failed: 0,
      withoutEmail: 0,
      alreadySent: 0,
    };

    for (const loan of await this.alerts.findDueLoans(dueSoonLimit(now))) {
      const type = classifyDueDate(loan.dueAt, now);
      if (!type) continue;
      if (loan.notifications.some((n) => n.type === type)) {
        reminders.alreadySent += 1;
        continue;
      }
      if (!(await this.alerts.claimNotification(loan.loanId, type))) {
        reminders.alreadySent += 1;
        continue;
      }
      if (!loan.reader.email) {
        // El aviso queda en el panel aunque no se pueda enviar el correo.
        await this.alerts.markNotificationFailed(
          loan.loanId,
          type,
          NO_EMAIL_ERROR,
        );
        reminders.withoutEmail += 1;
        continue;
      }
      try {
        await this.email.send(
          dueReminderMessage({
            to: loan.reader.email,
            readerName: loan.reader.fullName,
            workTitle: loan.workTitle,
            inventoryCode: loan.inventoryCode,
            dueAt: loan.dueAt,
            type,
          }),
        );
        await this.alerts.markNotificationSent(
          loan.loanId,
          type,
          this.clock.now(),
        );
        reminders.sent += 1;
      } catch (error) {
        await this.alerts.markNotificationFailed(
          loan.loanId,
          type,
          error instanceof Error ? error.message : String(error),
        );
        reminders.failed += 1;
      }
    }

    return { reminders, availability: await this.availability.execute() };
  }
}
