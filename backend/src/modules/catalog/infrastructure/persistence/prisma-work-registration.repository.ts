import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { normalizeText } from '../../../../shared/domain/normalize-text';
import type { NewWork } from '../../domain/entities/new-work';
import type {
  RegisteredWork,
  WorkRegistrationRepository,
} from '../../application/ports/work-registration.repository';

@Injectable()
export class PrismaWorkRegistrationRepository implements WorkRegistrationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async categoryExists(id: string): Promise<boolean> {
    return (await this.prisma.category.count({ where: { id } })) > 0;
  }

  create(work: NewWork): Promise<RegisteredWork> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.work.create({
        data: {
          title: work.title,
          year: work.year,
          categoryId: work.categoryId,
          // La búsqueda pública usa este campo (índice trigram).
          searchText: normalizeText(work.title),
        },
        select: { id: true, title: true },
      });
      await this.linkAuthors(tx, created.id, work.authors);
      await this.linkSubjects(tx, created.id, work.subjects);
      return created;
    });
  }

  /** Reutiliza el autor si ya existe con el mismo nombre normalizado. */
  private async linkAuthors(
    tx: Prisma.TransactionClient,
    workId: string,
    names: readonly string[],
  ): Promise<void> {
    for (const [position, name] of names.entries()) {
      const normalizedName = normalizeText(name);
      const author = await tx.author.upsert({
        where: { normalizedName },
        create: { name, normalizedName },
        update: {},
      });
      await tx.workAuthor.create({
        data: { workId, authorId: author.id, position },
      });
    }
  }

  private async linkSubjects(
    tx: Prisma.TransactionClient,
    workId: string,
    names: readonly string[],
  ): Promise<void> {
    for (const name of names) {
      const normalizedName = normalizeText(name);
      const subject = await tx.subject.upsert({
        where: { normalizedName },
        create: { name, normalizedName },
        update: {},
      });
      await tx.workSubject.create({ data: { workId, subjectId: subject.id } });
    }
  }
}
