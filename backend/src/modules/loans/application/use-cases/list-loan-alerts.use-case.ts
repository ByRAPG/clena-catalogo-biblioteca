import { Inject, Injectable } from '@nestjs/common';
import {
  classifyDueDate,
  compareDueAlerts,
  dueSoonLimit,
  type DueAlertType,
} from '../../domain/alerts/due-alert';
import type { LoanClock } from '../ports/clock.port';
import {
  LOAN_ALERTS_REPOSITORY,
  type LoanAlertsRepository,
  type PendingAvailabilityAlert,
} from '../ports/loan-alerts.repository';
import { LOAN_CLOCK } from '../tokens';

export interface LoanAlertItem {
  loanId: string;
  type: DueAlertType;
  dueAt: Date;
  inventoryCode: string;
  workTitle: string;
  readerName: string;
  readerEmail: string | null;
  /** Cuándo se envió el correo de este aviso; null si no se ha enviado. */
  notifiedAt: Date | null;
  /** Motivo si el correo no se pudo enviar. */
  notifyError: string | null;
}

export interface LoanAlertsPanel {
  loans: LoanAlertItem[];
  availability: PendingAvailabilityAlert[];
}

/** HU-21: panel de alertas, con los préstamos vencidos primero. */
@Injectable()
export class ListLoanAlertsUseCase {
  constructor(
    @Inject(LOAN_ALERTS_REPOSITORY)
    private readonly alerts: LoanAlertsRepository,
    @Inject(LOAN_CLOCK) private readonly clock: LoanClock,
  ) {}

  async execute(): Promise<LoanAlertsPanel> {
    const now = this.clock.now();
    const loans: LoanAlertItem[] = [];
    for (const loan of await this.alerts.findDueLoans(dueSoonLimit(now))) {
      const type = classifyDueDate(loan.dueAt, now);
      if (!type) continue;
      const notification = loan.notifications.find((n) => n.type === type);
      loans.push({
        loanId: loan.loanId,
        type,
        dueAt: loan.dueAt,
        inventoryCode: loan.inventoryCode,
        workTitle: loan.workTitle,
        readerName: loan.reader.fullName,
        readerEmail: loan.reader.email,
        notifiedAt: notification?.sentAt ?? null,
        notifyError: notification?.error ?? null,
      });
    }
    loans.sort(compareDueAlerts);
    return {
      loans,
      availability: await this.alerts.listPendingAvailabilityAlerts(),
    };
  }
}
