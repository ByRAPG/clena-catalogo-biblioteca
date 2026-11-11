import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import {
  SearchCriteria,
  SearchPage,
  SearchRepository,
} from '../application/ports/search.repository';
import { MatchScores, resolveMatchedOn } from '../domain/matched-on';
import { resolveAvailability } from '../domain/work-availability';
import {
  CategoryRef,
  CopyRecord,
  MatchedOn,
  WorkDetail,
  WorkSummary,
} from '../domain/work-summary';

/**
 * Umbral de `word_similarity` para el operador `<%`. Se fija con
 * `set_config(..., is_local = true)` dentro de la transacción de la consulta,
 * así no se filtra a otras conexiones del pool.
 */
const WORD_SIMILARITY_THRESHOLD = '0.4';

/** Pesos por origen: el título pesa más que el autor y este más que el tema. */
const WEIGHT_TITLE = 1.0;
const WEIGHT_AUTHOR = 0.95;
const WEIGHT_SUBJECT = 0.9;

const workInclude = {
  category: true,
  authors: { orderBy: { position: 'asc' }, include: { author: true } },
  subjects: { include: { subject: true } },
  copies: {
    where: { status: { not: 'BAJA' } },
    orderBy: { inventoryCode: 'asc' },
    include: { shelf: { include: { section: { include: { room: true } } } } },
  },
} satisfies Prisma.WorkInclude;

type WorkRow = Prisma.WorkGetPayload<{ include: typeof workInclude }>;

interface ScoreRow {
  id: string;
  title_score: number | null;
  author_score: number | null;
  subject_score: number | null;
}

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class PrismaSearchRepository implements SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchWorks(criteria: SearchCriteria): Promise<SearchPage> {
    const candidates = this.candidatesSql(criteria);
    const offset = (criteria.page - 1) * criteria.pageSize;

    const { rows, total } = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT set_config('pg_trgm.word_similarity_threshold', ${WORD_SIMILARITY_THRESHOLD}, true)`;
      const pageRows = await tx.$queryRaw<ScoreRow[]>(Prisma.sql`
        ${candidates}
        SELECT id, title_score, author_score, subject_score
        FROM cand
        ORDER BY score DESC, title ASC, id ASC
        LIMIT ${criteria.pageSize} OFFSET ${offset}`);
      const [{ total: count }] = await tx.$queryRaw<{ total: number }[]>(
        Prisma.sql`${candidates} SELECT count(*)::int AS total FROM cand`,
      );
      return { rows: pageRows, total: count };
    });

    if (rows.length === 0) return { items: [], total };

    const works = await this.prisma.work.findMany({
      where: { id: { in: rows.map((r) => r.id) } },
      include: workInclude,
    });
    const byId = new Map(works.map((w) => [w.id, w]));
    const items: WorkSummary[] = [];
    for (const row of rows) {
      const work = byId.get(row.id);
      if (!work) continue;
      const scores: MatchScores = {
        title: row.title_score,
        author: row.author_score,
        subject: row.subject_score,
      };
      items.push(this.toSummary(work, resolveMatchedOn(scores)));
    }
    return { items, total };
  }

  async findWorkDetail(id: string): Promise<WorkDetail | null> {
    const work = await this.prisma.work.findFirst({
      where: { id, deletedAt: null },
      include: workInclude,
    });
    if (!work) return null;
    const resolved = resolveAvailability(
      this.toCopyRecords(work),
      work.digitalUrl !== null,
    );
    return {
      ...this.toSummary(work, null),
      subtitle: work.subtitle,
      publisher: work.publisher,
      isbn: work.isbn,
      classification: work.classification,
      digitalUrl: work.digitalUrl,
      copies: resolved.copies.map((c) => ({
        inventoryCode: c.inventoryCode,
        status: c.status,
        room: c.location.room,
        section: c.location.section,
        shelf: c.location.shelf,
      })),
    };
  }

  async listCategories(): Promise<CategoryRef[]> {
    return this.prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async listRooms(): Promise<CategoryRef[]> {
    return this.prisma.room.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  private toCopyRecords(work: WorkRow): CopyRecord[] {
    return work.copies.map((c) => ({
      inventoryCode: c.inventoryCode,
      status: c.status,
      location: {
        room: c.shelf.section.room.name,
        section: c.shelf.section.name,
        shelf: c.shelf.code,
      },
    }));
  }

  private toSummary(work: WorkRow, matchedOn: MatchedOn | null): WorkSummary {
    const { availability, location } = resolveAvailability(
      this.toCopyRecords(work),
      work.digitalUrl !== null,
    );
    return {
      id: work.id,
      title: work.title,
      authors: work.authors.map((wa) => wa.author.name),
      subjects: work.subjects
        .map((ws) => ws.subject.name)
        .sort((a, b) => a.localeCompare(b, 'es')),
      category: work.category
        ? { id: work.category.id, name: work.category.name }
        : null,
      year: work.year,
      matchedOn,
      availability,
      location,
    };
  }

  /**
   * CTE `cand` con las obras que cumplen texto y filtros, más la puntuación
   * ponderada por origen. Todo parametrizado con Prisma.sql.
   */
  private candidatesSql(criteria: SearchCriteria): Prisma.Sql {
    const conditions: Prisma.Sql[] = [Prisma.sql`w.deleted_at IS NULL`];
    if (criteria.categoryId) {
      conditions.push(Prisma.sql`w.category_id = ${criteria.categoryId}::uuid`);
    }
    if (criteria.roomId || criteria.onlyAvailable) {
      const copyConditions: Prisma.Sql[] = [
        Prisma.sql`c.work_id = w.id`,
        criteria.onlyAvailable
          ? Prisma.sql`c.status = 'DISPONIBLE'`
          : Prisma.sql`c.status <> 'BAJA'`,
      ];
      if (criteria.roomId) {
        copyConditions.push(Prisma.sql`se.room_id = ${criteria.roomId}::uuid`);
      }
      conditions.push(Prisma.sql`EXISTS (
        SELECT 1 FROM copies c
        JOIN shelves sh ON sh.id = c.shelf_id
        JOIN sections se ON se.id = sh.section_id
        WHERE ${Prisma.join(copyConditions, ' AND ')})`);
    }
    const filters = Prisma.join(conditions, ' AND ');

    if (criteria.query === null) {
      return Prisma.sql`WITH cand AS (
        SELECT w.id, w.title,
               NULL::float8 AS title_score, NULL::float8 AS author_score,
               NULL::float8 AS subject_score, 0::float8 AS score
        FROM works w WHERE ${filters})`;
    }

    const q = criteria.query;
    const contains = `%${escapeLike(q)}%`;
    const prefix = `${escapeLike(q)}%`;
    const matches = (col: Prisma.Sql): Prisma.Sql =>
      Prisma.sql`(${q}::text <% ${col} OR ${col} LIKE ${contains})`;
    // Exacta > prefijo > contiene > similar (word_similarity, entre 0 y 1).
    const score = (col: Prisma.Sql, weight: number): Prisma.Sql => Prisma.sql`(
      CASE WHEN ${col} = ${q} THEN 2.0
           WHEN ${col} LIKE ${prefix} THEN 1.6
           WHEN ${col} LIKE ${contains} THEN 1.3
           ELSE word_similarity(${q}::text, ${col}) END * ${weight}::float8)`;

    const title = Prisma.raw('w.search_text');
    const author = Prisma.raw('au.normalized_name');
    const subject = Prisma.raw('su.normalized_name');

    return Prisma.sql`WITH
      t AS (
        SELECT w.id, ${score(title, WEIGHT_TITLE)}::float8 AS s
        FROM works w WHERE w.deleted_at IS NULL AND ${matches(title)}),
      a AS (
        SELECT wa.work_id AS id, max(${score(author, WEIGHT_AUTHOR)})::float8 AS s
        FROM authors au JOIN work_authors wa ON wa.author_id = au.id
        WHERE ${matches(author)} GROUP BY wa.work_id),
      s AS (
        SELECT ws.work_id AS id, max(${score(subject, WEIGHT_SUBJECT)})::float8 AS s
        FROM subjects su JOIN work_subjects ws ON ws.subject_id = su.id
        WHERE ${matches(subject)} GROUP BY ws.work_id),
      cand AS (
        SELECT w.id, w.title,
               t.s AS title_score, a.s AS author_score, s.s AS subject_score,
               GREATEST(t.s, a.s, s.s) AS score
        FROM works w
        LEFT JOIN t ON t.id = w.id
        LEFT JOIN a ON a.id = w.id
        LEFT JOIN s ON s.id = w.id
        WHERE (t.s IS NOT NULL OR a.s IS NOT NULL OR s.s IS NOT NULL)
          AND ${filters})`;
  }
}
