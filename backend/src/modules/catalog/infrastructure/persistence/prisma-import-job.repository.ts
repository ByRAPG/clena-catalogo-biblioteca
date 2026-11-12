import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import type {
  IImportJobRepository,
  SaveImportJobInput,
} from '../../application/ports/import-job.repository';

@Injectable()
export class PrismaImportJobRepository implements IImportJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(input: SaveImportJobInput): Promise<void> {
    const { created, updated, failed, rows } = input.report;
    await this.prisma.importJob.create({
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
    });
  }
}
