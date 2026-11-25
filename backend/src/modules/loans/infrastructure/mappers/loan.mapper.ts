import type { CopyStatus, Prisma } from '@prisma/client';
import { Loan, type CopyStatusDomain } from '../../domain/entities/loan.entity';
import type {
  LoanCopySummary,
  LoanReaderSummary,
  LoanRecord,
} from '../../domain/repositories/loan.repository';

export const LOAN_RECORD_INCLUDE = {
  copy: {
    include: {
      work: { select: { id: true, title: true } },
      shelf: {
        include: {
          section: {
            include: {
              room: { select: { name: true } },
            },
          },
        },
      },
    },
  },
  reader: {
    select: {
      id: true,
      fullName: true,
      documentId: true,
      email: true,
    },
  },
  staff: {
    select: {
      id: true,
      fullName: true,
    },
  },
} as const satisfies Prisma.LoanInclude;

export type PrismaLoanWithRelations = Prisma.LoanGetPayload<{
  include: typeof LOAN_RECORD_INCLUDE;
}>;

export const LOAN_COPY_INCLUDE = {
  work: { select: { id: true, title: true } },
  shelf: {
    include: {
      section: {
        include: {
          room: { select: { name: true } },
        },
      },
    },
  },
  reservations: {
    where: { status: 'ACTIVA' },
    select: { id: true },
    take: 1,
  },
} as const satisfies Prisma.CopyInclude;

export type PrismaCopyWithRelations = Prisma.CopyGetPayload<{
  include: typeof LOAN_COPY_INCLUDE;
}>;

export type PrismaReaderRow = {
  id: string;
  fullName: string;
  documentId: string | null;
  email: string | null;
  phone: string | null;
  anonymizedAt: Date | null;
};

export function toCopyStatusDomain(status: CopyStatus): CopyStatusDomain {
  return status;
}

export function toLoanCopySummary(
  row: PrismaCopyWithRelations,
): LoanCopySummary {
  return {
    id: row.id,
    inventoryCode: row.inventoryCode,
    status: toCopyStatusDomain(row.status),
    workId: row.work.id,
    workTitle: row.work.title,
    room: row.shelf.section.room.name,
    section: row.shelf.section.name,
    shelf: row.shelf.code,
    hasActiveReservation: row.reservations.length > 0,
  };
}

export function toLoanReaderSummary(row: PrismaReaderRow): LoanReaderSummary {
  return {
    id: row.id,
    fullName: row.fullName,
    documentId: row.documentId,
    email: row.email,
    phone: row.phone,
    anonymizedAt: row.anonymizedAt,
  };
}

export function toLoanRecord(row: PrismaLoanWithRelations): LoanRecord {
  return {
    loan: new Loan({
      id: row.id,
      copyId: row.copyId,
      readerId: row.readerId,
      staffId: row.staffId,
      loanedAt: row.loanedAt,
      dueAt: row.dueAt,
      returnedAt: row.returnedAt,
    }),
    copy: {
      id: row.copy.id,
      inventoryCode: row.copy.inventoryCode,
      status: toCopyStatusDomain(row.copy.status),
      workId: row.copy.work.id,
      workTitle: row.copy.work.title,
      room: row.copy.shelf.section.room.name,
      section: row.copy.shelf.section.name,
      shelf: row.copy.shelf.code,
    },
    reader: {
      id: row.reader.id,
      fullName: row.reader.fullName,
      documentId: row.reader.documentId,
      email: row.reader.email,
    },
    staff: row.staff
      ? {
          id: row.staff.id,
          fullName: row.staff.fullName,
        }
      : null,
  };
}
