import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import type {
  CatalogTerm,
  CatalogTermKind,
  CatalogTermRepository,
} from '../../application/ports/catalog-term.repository';

/** Usa los índices trigram de `normalized_name` (LIKE '%texto%'). */
@Injectable()
export class PrismaCatalogTermRepository implements CatalogTermRepository {
  constructor(private readonly prisma: PrismaService) {}

  suggest(
    kind: CatalogTermKind,
    normalizedQuery: string,
    limit: number,
  ): Promise<CatalogTerm[]> {
    const where = { normalizedName: { contains: normalizedQuery } };
    const select = { id: true, name: true } as const;
    if (kind === 'authors') {
      return this.prisma.author.findMany({
        where,
        select,
        orderBy: { normalizedName: 'asc' },
        take: limit,
      });
    }
    return this.prisma.subject.findMany({
      where,
      select,
      orderBy: { normalizedName: 'asc' },
      take: limit,
    });
  }
}
