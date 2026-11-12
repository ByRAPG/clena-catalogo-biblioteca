import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { normalizeText } from '../../../../shared/domain/normalize-text';
import type { ImportRow } from '../../domain/entities/import-row';
import { ImportRowError } from '../../domain/errors/import-row-error';
import type {
  ICatalogImportRepository,
  ImportRowOutcome,
} from '../../domain/repositories/catalog-import.repository';
import { ImportRowMapper } from '../mappers/import-row.mapper';

@Injectable()
export class PrismaCatalogImportRepository implements ICatalogImportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveRow(row: ImportRow): Promise<ImportRowOutcome> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existingCopy = await tx.copy.findUnique({
          where: { inventoryCode: row.data.inventoryCode },
          include: { work: true },
        });
        const fallbackId = this.workIdentity(row);
        const existingWork = row.data.isbn
          ? await tx.work.findUnique({ where: { isbn: row.data.isbn } })
          : (existingCopy?.work ??
            (await tx.work.findUnique({ where: { id: fallbackId } })));

        if (
          existingCopy &&
          row.data.isbn &&
          existingCopy.work.isbn !== row.data.isbn
        ) {
          throw new ImportRowError(
            'codigo_ejemplar',
            'El ejemplar existente pertenece a una obra con otro ISBN',
          );
        }
        if (existingWork?.deletedAt) {
          throw new ImportRowError(
            'isbn',
            'La obra está eliminada del catálogo',
          );
        }
        await this.validateActiveCirculation(tx, existingCopy, row);
        const categoryId = row.data.category
          ? (
              await tx.category.upsert({
                where: { normalizedName: normalizeText(row.data.category) },
                create: {
                  name: row.data.category,
                  normalizedName: normalizeText(row.data.category),
                },
                update: {},
              })
            ).id
          : null;
        const data = ImportRowMapper.toPersistence(row, categoryId);
        if (!row.data.isbn && existingWork?.isbn) data.isbn = existingWork.isbn;
        if (existingWork?.subtitle) {
          data.searchText = normalizeText(
            `${row.data.title} ${existingWork.subtitle}`,
          );
        }
        const work = existingWork
          ? await tx.work.update({ where: { id: existingWork.id }, data })
          : await tx.work.create({
              data: { ...data, ...(!row.data.isbn ? { id: fallbackId } : {}) },
            });
        await this.saveAuthors(tx, work.id, row.data.authors);
        await this.saveSubjects(tx, work.id, row.data.subjects);
        const shelfId = await this.saveLocation(tx, row);
        await tx.copy.upsert({
          where: { inventoryCode: row.data.inventoryCode },
          create: {
            inventoryCode: row.data.inventoryCode,
            workId: work.id,
            shelfId,
            status: row.data.status,
          },
          update: { shelfId, status: row.data.status },
        });
        return existingCopy ? 'updated' : 'created';
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ImportRowError(
          'codigo_ejemplar',
          'Conflicto con un registro existente; revise el ISBN y el código del ejemplar',
        );
      }
      throw error;
    }
  }

  private workIdentity(row: ImportRow): string {
    const fingerprint = JSON.stringify([
      'clena-csv-work-v1',
      normalizeText(row.data.title),
      [...new Set(row.data.authors.map(normalizeText))].sort(),
      row.data.year ?? null,
      normalizeText(row.data.publisher ?? ''),
      normalizeText(row.data.classification ?? ''),
    ]);
    const bytes = createHash('sha256')
      .update(fingerprint)
      .digest()
      .subarray(0, 16);
    bytes[6] = (bytes[6] & 0x0f) | 0x80;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = bytes.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  private async validateActiveCirculation(
    tx: Prisma.TransactionClient,
    copy: { id: string; status: string } | null,
    row: ImportRow,
  ): Promise<void> {
    if (!copy || copy.status === row.data.status) return;
    const activeLoan = await tx.loan.findFirst({
      where: { copyId: copy.id, returnedAt: null },
    });
    const activeReservation = await tx.reservation.findFirst({
      where: { copyId: copy.id, status: 'ACTIVA' },
    });
    if (activeLoan || activeReservation) {
      throw new ImportRowError(
        'estado',
        'El ejemplar tiene un préstamo o reserva activos',
      );
    }
  }

  private async saveAuthors(
    tx: Prisma.TransactionClient,
    workId: string,
    names: readonly string[],
  ) {
    const uniqueNames = new Map(
      names.map((name) => [normalizeText(name), name]),
    );
    await tx.workAuthor.deleteMany({ where: { workId } });
    let position = 0;
    for (const [normalizedName, name] of uniqueNames) {
      const author = await tx.author.upsert({
        where: { normalizedName },
        create: { name, normalizedName },
        update: {},
      });
      await tx.workAuthor.create({
        data: { workId, authorId: author.id, position },
      });
      position += 1;
    }
  }

  private async saveSubjects(
    tx: Prisma.TransactionClient,
    workId: string,
    names: readonly string[],
  ) {
    const uniqueNames = new Map(
      names.map((name) => [normalizeText(name), name]),
    );
    await tx.workSubject.deleteMany({ where: { workId } });
    for (const [normalizedName, name] of uniqueNames) {
      const subject = await tx.subject.upsert({
        where: { normalizedName },
        create: { name, normalizedName },
        update: {},
      });
      await tx.workSubject.create({ data: { workId, subjectId: subject.id } });
    }
  }

  private async saveLocation(
    tx: Prisma.TransactionClient,
    row: ImportRow,
  ): Promise<string> {
    const { room: name, section: sectionName, shelf: code } = row.data;
    const room = await tx.room.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    const section = await tx.section.upsert({
      where: { roomId_name: { roomId: room.id, name: sectionName } },
      create: { roomId: room.id, name: sectionName },
      update: {},
    });
    const shelf = await tx.shelf.upsert({
      where: { sectionId_code: { sectionId: section.id, code } },
      create: { sectionId: section.id, code },
      update: {},
    });
    return shelf.id;
  }
}
