import { Injectable } from '@nestjs/common';
import { CopyStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import type { DueAlertType } from '../../domain/alerts/due-alert';
import { AvailabilityAlertPendingError } from '../../domain/errors/loan.errors';
import type {
  DueLoan,
  LoanAlertsRepository,
  PendingAvailabilityAlert,
  ReaderContact,
} from '../../application/ports/loan-alerts.repository';

const READER_SELECT = { id: true, fullName: true, email: true } as const;

/** Un ejemplar disponible y sin reserva activa: la obra se puede pedir. */
const AVAILABLE_COPY: Prisma.CopyWhereInput = {
  status: CopyStatus.DISPONIBLE,
  reservations: { none: { status: 'ACTIVA' } },
};

const ALERT_SELECT = {
  id: true,
  createdAt: true,
  workId: true,
  work: { select: { title: true } },
  reader: { select: READER_SELECT },
} as const;

type AlertRow = Prisma.AvailabilityAlertGetPayload<{
  select: typeof ALERT_SELECT;
}>;

function toAlert(row: AlertRow): PendingAvailabilityAlert {
  return {
    id: row.id,
    createdAt: row.createdAt,
    workId: row.workId,
    workTitle: row.work.title,
    reader: row.reader,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

@Injectable()
export class PrismaLoanAlertsRepository implements LoanAlertsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDueLoans(until: Date): Promise<DueLoan[]> {
    const rows = await this.prisma.loan.findMany({
      where: { returnedAt: null, dueAt: { lt: until } },
      orderBy: { dueAt: 'asc' },
      select: {
        id: true,
        dueAt: true,
        copy: {
          select: { inventoryCode: true, work: { select: { title: true } } },
        },
        reader: { select: READER_SELECT },
        notifications: { select: { type: true, sentAt: true, error: true } },
      },
    });
    return rows.map((row) => ({
      loanId: row.id,
      dueAt: row.dueAt,
      inventoryCode: row.copy.inventoryCode,
      workTitle: row.copy.work.title,
      reader: row.reader,
      notifications: row.notifications,
    }));
  }

  async claimNotification(
    loanId: string,
    type: DueAlertType,
  ): Promise<boolean> {
    try {
      await this.prisma.notification.create({ data: { loanId, type } });
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      throw error;
    }
  }

  async markNotificationSent(
    loanId: string,
    type: DueAlertType,
    sentAt: Date,
  ): Promise<void> {
    await this.prisma.notification.update({
      where: { loanId_type: { loanId, type } },
      data: { sentAt, error: null },
    });
  }

  async markNotificationFailed(
    loanId: string,
    type: DueAlertType,
    error: string,
  ): Promise<void> {
    await this.prisma.notification.update({
      where: { loanId_type: { loanId, type } },
      data: { error: error.slice(0, 500) },
    });
  }

  async findDeliverableAvailabilityAlerts(
    workId?: string,
  ): Promise<PendingAvailabilityAlert[]> {
    const rows = await this.prisma.availabilityAlert.findMany({
      where: {
        notifiedAt: null,
        ...(workId ? { workId } : {}),
        work: { deletedAt: null, copies: { some: AVAILABLE_COPY } },
      },
      orderBy: { createdAt: 'asc' },
      select: ALERT_SELECT,
    });
    return rows.map(toAlert);
  }

  async claimAvailabilityAlert(id: string, notifiedAt: Date): Promise<boolean> {
    const { count } = await this.prisma.availabilityAlert.updateMany({
      where: { id, notifiedAt: null },
      data: { notifiedAt },
    });
    return count === 1;
  }

  async releaseAvailabilityAlert(id: string): Promise<void> {
    try {
      await this.prisma.availabilityAlert.update({
        where: { id },
        data: { notifiedAt: null },
      });
    } catch (error) {
      // Ya hay otro aviso pendiente igual: basta con ese.
      if (!isUniqueViolation(error)) throw error;
    }
  }

  async listPendingAvailabilityAlerts(): Promise<PendingAvailabilityAlert[]> {
    const rows = await this.prisma.availabilityAlert.findMany({
      where: { notifiedAt: null },
      orderBy: { createdAt: 'asc' },
      select: ALERT_SELECT,
    });
    return rows.map(toAlert);
  }

  findReader(readerId: string): Promise<ReaderContact | null> {
    return this.prisma.reader.findFirst({
      where: { id: readerId, anonymizedAt: null },
      select: READER_SELECT,
    });
  }

  async findWork(
    workId: string,
  ): Promise<{ id: string; title: string; available: boolean } | null> {
    const work = await this.prisma.work.findFirst({
      where: { id: workId, deletedAt: null },
      select: {
        id: true,
        title: true,
        copies: { where: AVAILABLE_COPY, select: { id: true }, take: 1 },
      },
    });
    if (!work) return null;
    return {
      id: work.id,
      title: work.title,
      available: work.copies.length > 0,
    };
  }

  async createAvailabilityAlert(
    readerId: string,
    workId: string,
  ): Promise<PendingAvailabilityAlert> {
    try {
      return toAlert(
        await this.prisma.availabilityAlert.create({
          data: { readerId, workId },
          select: ALERT_SELECT,
        }),
      );
    } catch (error) {
      if (isUniqueViolation(error)) throw new AvailabilityAlertPendingError();
      throw error;
    }
  }
}
