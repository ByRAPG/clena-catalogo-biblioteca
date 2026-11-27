import { Injectable } from '@nestjs/common';
import { CopyStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import type { NewReader } from '../../domain/entities/reader.entity';
import {
  CopyNotAvailableError,
  CopyNotFoundError,
  LoanAlreadyReturnedError,
} from '../../domain/errors/loan.errors';
import type {
  CreateLoanPersistenceInput,
  ListLoansQuery,
  LoanCopySummary,
  LoanReaderSummary,
  LoanRecord,
  LoanRepository,
  PaginatedLoans,
  ReturnLoanPersistenceInput,
} from '../../domain/repositories/loan.repository';
import {
  LOAN_COPY_INCLUDE,
  LOAN_RECORD_INCLUDE,
  toLoanCopySummary,
  toLoanReaderSummary,
  toLoanRecord,
} from '../mappers/loan.mapper';

@Injectable()
export class PrismaLoanRepository implements LoanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCopyById(id: string): Promise<LoanCopySummary | null> {
    const row = await this.prisma.copy.findFirst({
      where: { id, work: { deletedAt: null } },
      include: LOAN_COPY_INCLUDE,
    });
    return row ? toLoanCopySummary(row) : null;
  }

  async findCopyByInventoryCode(
    inventoryCode: string,
  ): Promise<LoanCopySummary | null> {
    const row = await this.prisma.copy.findFirst({
      where: {
        inventoryCode: { equals: inventoryCode, mode: 'insensitive' },
        work: { deletedAt: null },
      },
      include: LOAN_COPY_INCLUDE,
    });
    return row ? toLoanCopySummary(row) : null;
  }

  async searchCopies(query: string, limit: number): Promise<LoanCopySummary[]> {
    const where: Prisma.CopyWhereInput = {
      work: { deletedAt: null },
      status: { not: CopyStatus.BAJA },
      ...(query
        ? {
            OR: [
              { inventoryCode: { contains: query, mode: 'insensitive' } },
              { work: { title: { contains: query, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.copy.findMany({
      where,
      include: LOAN_COPY_INCLUDE,
      orderBy: [{ status: 'asc' }, { inventoryCode: 'asc' }],
      take: limit,
    });

    return rows.map(toLoanCopySummary);
  }

  async findReaderById(id: string): Promise<LoanReaderSummary | null> {
    const row = await this.prisma.reader.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        documentId: true,
        email: true,
        phone: true,
        anonymizedAt: true,
      },
    });
    return row ? toLoanReaderSummary(row) : null;
  }

  async searchReaders(
    query: string,
    limit: number,
  ): Promise<LoanReaderSummary[]> {
    const where: Prisma.ReaderWhereInput = {
      anonymizedAt: null,
      ...(query
        ? {
            OR: [
              { fullName: { contains: query, mode: 'insensitive' } },
              { documentId: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.reader.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        documentId: true,
        email: true,
        phone: true,
        anonymizedAt: true,
      },
      orderBy: { fullName: 'asc' },
      take: limit,
    });

    return rows.map(toLoanReaderSummary);
  }

  async createReader(reader: NewReader): Promise<LoanReaderSummary> {
    const row = await this.prisma.reader.create({
      data: {
        fullName: reader.fullName,
        documentId: reader.documentId,
        email: reader.email,
        phone: reader.phone,
      },
      select: {
        id: true,
        fullName: true,
        documentId: true,
        email: true,
        phone: true,
        anonymizedAt: true,
      },
    });
    return toLoanReaderSummary(row);
  }

  async findLoanById(id: string): Promise<LoanRecord | null> {
    const row = await this.prisma.loan.findUnique({
      where: { id },
      include: LOAN_RECORD_INCLUDE,
    });
    return row ? toLoanRecord(row) : null;
  }

  async createLoanAndMarkCopyLoaned(
    input: CreateLoanPersistenceInput,
  ): Promise<LoanRecord> {
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.copy.updateMany({
          where: { id: input.copyId, status: CopyStatus.DISPONIBLE },
          data: { status: CopyStatus.PRESTADO },
        });

        if (updated.count === 0) {
          const current = await tx.copy.findUnique({
            where: { id: input.copyId },
            select: { status: true },
          });
          if (!current) throw new CopyNotFoundError(input.copyId);
          throw new CopyNotAvailableError(
            current.status === CopyStatus.DISPONIBLE
              ? 'PRESTADO'
              : current.status,
          );
        }

        // Una reserva vigente de otro lector impide el préstamo (se revisa
        // aquí, ya con el ejemplar bloqueado, por si se reservó hace un instante).
        const foreign = await tx.reservation.count({
          where: {
            copyId: input.copyId,
            status: 'ACTIVA',
            expiresAt: { gt: input.loanedAt },
            readerId: { not: input.readerId },
          },
        });
        if (foreign > 0) throw new CopyNotAvailableError('RESERVADO');
        // Si presta a quien reservó, la reserva queda cumplida (RECOGIDA).
        await tx.reservation.updateMany({
          where: {
            copyId: input.copyId,
            status: 'ACTIVA',
            readerId: input.readerId,
          },
          data: { status: 'RECOGIDA', resolvedAt: input.loanedAt },
        });

        return tx.loan.create({
          data: {
            copyId: input.copyId,
            readerId: input.readerId,
            staffId: input.staffId,
            loanedAt: input.loanedAt,
            dueAt: input.dueAt,
          },
          include: LOAN_RECORD_INCLUDE,
        });
      });

      return toLoanRecord(row);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new CopyNotAvailableError('PRESTADO');
      }
      throw error;
    }
  }

  async markLoanReturnedAndCopyAvailable(
    input: ReturnLoanPersistenceInput,
  ): Promise<LoanRecord> {
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.loan.updateMany({
        where: { id: input.loanId, returnedAt: null },
        data: { returnedAt: input.returnedAt },
      });

      if (updated.count === 0) {
        throw new LoanAlreadyReturnedError();
      }

      await tx.copy.updateMany({
        where: { id: input.copyId, status: CopyStatus.PRESTADO },
        data: { status: CopyStatus.DISPONIBLE },
      });

      return tx.loan.findUniqueOrThrow({
        where: { id: input.loanId },
        include: LOAN_RECORD_INCLUDE,
      });
    });

    return toLoanRecord(row);
  }

  async listLoans(query: ListLoansQuery): Promise<PaginatedLoans> {
    const where: Prisma.LoanWhereInput = {
      ...(query.status === 'active'
        ? { returnedAt: null }
        : query.status === 'returned'
          ? { returnedAt: { not: null } }
          : {}),
      ...(query.q
        ? {
            OR: [
              {
                copy: {
                  inventoryCode: { contains: query.q, mode: 'insensitive' },
                },
              },
              {
                copy: {
                  work: { title: { contains: query.q, mode: 'insensitive' } },
                },
              },
              {
                reader: {
                  fullName: { contains: query.q, mode: 'insensitive' },
                },
              },
              {
                reader: {
                  documentId: { contains: query.q, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.LoanOrderByWithRelationInput[] =
      query.status === 'active'
        ? [{ dueAt: 'asc' }, { loanedAt: 'desc' }]
        : [{ loanedAt: 'desc' }];

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.loan.findMany({
        where,
        include: LOAN_RECORD_INCLUDE,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.loan.count({ where }),
    ]);

    return {
      items: rows.map(toLoanRecord),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }
}
