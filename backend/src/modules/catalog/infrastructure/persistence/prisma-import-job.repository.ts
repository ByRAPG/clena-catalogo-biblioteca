import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import type {
  IImportJobRepository,
  SaveImportJobInput,
  StoredImportJob,
} from '../../application/ports/import-job.repository';
import type { ImportErrorCsvEntry } from '../../domain/services/import-errors-csv.formatter';

@Injectable()
export class PrismaImportJobRepository implements IImportJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(input: SaveImportJobInput): Promise<string> {
    const { created, updated, failed, rows } = input.report;
    const job = await this.prisma.importJob.create({
      data: {
        fileName: input.fileName,
        userId: input.userId,
        created,
        updated,
        failed,
        errors: rows
          .filter((row) => row.status === 'failed')
          .map((row) => ({
            row: row.row,
            error: row.error,
            ...(row.field ? { field: row.field } : {}),
          })),
      },
      select: { id: true },
    });

    return job.id;
  }

  async findById(id: string): Promise<StoredImportJob | null> {
    const job = await this.prisma.importJob.findUnique({
      where: { id },
      select: { id: true, fileName: true, errors: true },
    });

    if (!job) {
      return null;
    }

    return {
      id: job.id,
      fileName: job.fileName,
      errors: this.parseErrors(job.errors),
    };
  }

  private parseErrors(raw: Prisma.JsonValue | null): ImportErrorCsvEntry[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    const entries: ImportErrorCsvEntry[] = [];
    for (const item of raw) {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) {
        continue;
      }
      const record = item as Record<string, unknown>;
      if (typeof record.row !== 'number' || typeof record.error !== 'string') {
        continue;
      }
      entries.push({
        row: record.row,
        error: record.error,
        ...(typeof record.field === 'string' ? { field: record.field } : {}),
      });
    }

    return entries;
  }
}
