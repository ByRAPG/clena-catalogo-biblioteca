import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import type {
  CopyCirculation,
  CopyStatus,
} from '../../domain/entities/copy-update';
import type { NewCopy } from '../../domain/entities/new-copy';
import { InventoryCodeTakenError } from '../../domain/errors/copy.errors';
import type {
  CopyChanges,
  CopyManagementRepository,
  CopyView,
  ShelfOption,
} from '../../application/ports/copy-management.repository';

const LOCATION_SELECT = {
  id: true,
  code: true,
  section: { select: { name: true, room: { select: { name: true } } } },
} as const;

const COPY_VIEW_SELECT = {
  id: true,
  inventoryCode: true,
  status: true,
  shelf: { select: LOCATION_SELECT },
} as const;

type CopyWithLocation = Prisma.CopyGetPayload<{
  select: typeof COPY_VIEW_SELECT;
}>;

function toView(copy: CopyWithLocation): CopyView {
  return {
    id: copy.id,
    inventoryCode: copy.inventoryCode,
    status: copy.status,
    shelfId: copy.shelf.id,
    shelf: copy.shelf.code,
    section: copy.shelf.section.name,
    room: copy.shelf.section.room.name,
  };
}

@Injectable()
export class PrismaCopyManagementRepository implements CopyManagementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCirculation(copyId: string): Promise<CopyCirculation | null> {
    const copy = await this.prisma.copy.findUnique({
      where: { id: copyId },
      select: {
        status: true,
        // Préstamo activo de verdad: sin fecha de devolución.
        loans: { where: { returnedAt: null }, select: { id: true }, take: 1 },
        reservations: {
          where: { status: 'ACTIVA' },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!copy) return null;
    return {
      status: copy.status,
      hasActiveLoan: copy.loans.length > 0,
      hasActiveReservation: copy.reservations.length > 0,
    };
  }

  async shelfExists(shelfId: string): Promise<boolean> {
    return (await this.prisma.shelf.count({ where: { id: shelfId } })) > 0;
  }

  async update(
    copyId: string,
    changes: CopyChanges,
    expectedStatus?: CopyStatus,
  ): Promise<CopyView | null> {
    if (expectedStatus !== undefined) {
      // Comprobación y escritura en una sola sentencia: si otro proceso cambió
      // el estado (p. ej. registró un préstamo), no se actualiza ninguna fila.
      const { count } = await this.prisma.copy.updateMany({
        where: { id: copyId, status: expectedStatus },
        data: changes,
      });
      if (count === 0) return null;
      const current = await this.prisma.copy.findUniqueOrThrow({
        where: { id: copyId },
        select: COPY_VIEW_SELECT,
      });
      return toView(current);
    }
    const copy = await this.prisma.copy.update({
      where: { id: copyId },
      data: changes,
      select: COPY_VIEW_SELECT,
    });
    return toView(copy);
  }

  async workExists(workId: string): Promise<boolean> {
    const count = await this.prisma.work.count({
      where: { id: workId, deletedAt: null },
    });
    return count > 0;
  }

  async inventoryCodeExists(inventoryCode: string): Promise<boolean> {
    return (await this.prisma.copy.count({ where: { inventoryCode } })) > 0;
  }

  async create(workId: string, copy: NewCopy): Promise<CopyView> {
    try {
      const created = await this.prisma.copy.create({
        data: {
          workId,
          shelfId: copy.shelfId,
          inventoryCode: copy.inventoryCode,
          status: copy.status,
        },
        select: COPY_VIEW_SELECT,
      });
      return toView(created);
    } catch (error: unknown) {
      // Dos personas registran el mismo código a la vez: gana la primera.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new InventoryCodeTakenError(copy.inventoryCode);
      }
      throw error;
    }
  }

  async listShelves(): Promise<ShelfOption[]> {
    const shelves = await this.prisma.shelf.findMany({
      select: LOCATION_SELECT,
      orderBy: [
        { section: { room: { name: 'asc' } } },
        { section: { name: 'asc' } },
        { code: 'asc' },
      ],
    });
    return shelves.map((s) => ({
      id: s.id,
      code: s.code,
      section: s.section.name,
      room: s.section.room.name,
    }));
  }
}
