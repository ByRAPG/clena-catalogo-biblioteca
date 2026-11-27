import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import {
  AlreadyReservedError,
  NoCopyAvailableError,
  ReservationAccountInvalidError,
  ReservationLimitReachedError,
  WorkNotFoundForReservationError,
} from '../domain/reservation.errors';
import {
  MAX_ACTIVE_RESERVATIONS_PER_READER,
  type ReservationRecord,
  type ReservationRepository,
} from '../domain/reservation.repository';

const RESERVATION_INCLUDE = {
  copy: { select: { inventoryCode: true } },
  work: { select: { title: true } },
} as const satisfies Prisma.ReservationInclude;

type Row = Prisma.ReservationGetPayload<{
  include: typeof RESERVATION_INCLUDE;
}>;

function toRecord(row: Row): ReservationRecord {
  return {
    id: row.id,
    workId: row.workId,
    workTitle: row.work.title,
    copyId: row.copyId,
    inventoryCode: row.copy.inventoryCode,
    readerId: row.readerId,
    status: row.status,
    reservedAt: row.reservedAt,
    expiresAt: row.expiresAt,
  };
}

/** Marca interna para reintentar con otro ejemplar dentro del mismo intento. */
class CopyTakenSignal extends Error {}

@Injectable()
export class PrismaReservationRepository implements ReservationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureReaderForUser(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        fullName: true,
        email: true,
        active: true,
        anonymizedAt: true,
        reader: { select: { id: true, anonymizedAt: true } },
      },
    });
    if (!user || !user.active || user.anonymizedAt !== null) {
      throw new ReservationAccountInvalidError();
    }
    if (user.reader) {
      if (user.reader.anonymizedAt !== null) {
        throw new ReservationAccountInvalidError();
      }
      return user.reader.id;
    }
    try {
      const created = await this.prisma.reader.create({
        data: { userId, fullName: user.fullName, email: user.email },
        select: { id: true },
      });
      return created.id;
    } catch (error) {
      // Dos peticiones simultáneas: gana una y la otra lee el lector creado.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const again = await this.prisma.reader.findUniqueOrThrow({
          where: { userId },
          select: { id: true },
        });
        return again.id;
      }
      throw error;
    }
  }

  async reserveAvailableCopy(input: {
    workId: string;
    readerId: string;
    reservedAt: Date;
    expiresAt: Date;
  }): Promise<ReservationRecord> {
    const work = await this.prisma.work.findFirst({
      where: { id: input.workId, deletedAt: null },
      select: { id: true },
    });
    if (!work) throw new WorkNotFoundForReservationError();

    // Hasta 3 intentos: otro lector puede quedarse con el ejemplar elegido.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.tryReserve(input);
      } catch (error) {
        if (!(error instanceof CopyTakenSignal)) throw error;
      }
    }
    throw new NoCopyAvailableError();
  }

  private tryReserve(input: {
    workId: string;
    readerId: string;
    reservedAt: Date;
    expiresAt: Date;
  }): Promise<ReservationRecord> {
    return this.prisma
      .$transaction(async (tx) => {
        // Bloquea la fila del lector: dos reservas simultáneas suyas se
        // ejecutan una tras otra y la segunda ve a la primera.
        await tx.reader.update({
          where: { id: input.readerId },
          data: { updatedAt: input.reservedAt },
        });
        const duplicate = await tx.reservation.count({
          where: {
            workId: input.workId,
            readerId: input.readerId,
            status: 'ACTIVA',
          },
        });
        if (duplicate > 0) throw new AlreadyReservedError();
        const active = await tx.reservation.count({
          where: { readerId: input.readerId, status: 'ACTIVA' },
        });
        if (active >= MAX_ACTIVE_RESERVATIONS_PER_READER) {
          throw new ReservationLimitReachedError(
            MAX_ACTIVE_RESERVATIONS_PER_READER,
          );
        }

        const candidate = await tx.copy.findFirst({
          where: {
            workId: input.workId,
            status: 'DISPONIBLE',
            reservations: { none: { status: 'ACTIVA' } },
          },
          orderBy: { inventoryCode: 'asc' },
          select: { id: true },
        });
        if (!candidate) throw new NoCopyAvailableError();

        // Toma el candado del ejemplar: un préstamo simultáneo, que cambia su
        // estado, espera a que esta transacción termine.
        const locked = await tx.copy.updateMany({
          where: { id: candidate.id, status: 'DISPONIBLE' },
          data: { status: 'DISPONIBLE' },
        });
        if (locked.count === 0) throw new CopyTakenSignal();

        const row = await tx.reservation.create({
          data: {
            workId: input.workId,
            copyId: candidate.id,
            readerId: input.readerId,
            reservedAt: input.reservedAt,
            expiresAt: input.expiresAt,
          },
          include: RESERVATION_INCLUDE,
        });
        return toRecord(row);
      })
      .catch((error: unknown) => {
        // Índice único parcial: otra reserva activa tomó el mismo ejemplar.
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new CopyTakenSignal();
        }
        throw error;
      });
  }

  async listActiveByReader(readerId: string): Promise<ReservationRecord[]> {
    const rows = await this.prisma.reservation.findMany({
      where: { readerId, status: 'ACTIVA' },
      include: RESERVATION_INCLUDE,
      orderBy: { expiresAt: 'asc' },
    });
    return rows.map(toRecord);
  }

  async cancel(input: {
    reservationId: string;
    readerId: string;
    now: Date;
  }): Promise<boolean> {
    const result = await this.prisma.reservation.updateMany({
      where: {
        id: input.reservationId,
        readerId: input.readerId,
        status: 'ACTIVA',
      },
      data: { status: 'CANCELADA', resolvedAt: input.now },
    });
    return result.count === 1;
  }

  async expireDue(now: Date): Promise<number> {
    const result = await this.prisma.reservation.updateMany({
      where: { status: 'ACTIVA', expiresAt: { lte: now } },
      data: { status: 'VENCIDA', resolvedAt: now },
    });
    return result.count;
  }
}
