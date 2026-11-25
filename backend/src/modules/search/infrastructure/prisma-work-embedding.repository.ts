import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import {
  NearestFilters,
  NearestWork,
  StaleWork,
  WorkEmbeddingRepository,
} from '../application/ports/work-embedding.repository';
import { toVectorLiteral } from './pgvector';

interface StaleRow {
  work_id: string;
  source_text: string;
  source_hash: string;
}

interface NearestRow {
  work_id: string;
  score: number;
}

@Injectable()
export class PrismaWorkEmbeddingRepository implements WorkEmbeddingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findStale(model: string, limit: number): Promise<StaleWork[]> {
    // Texto fuente en lenguaje natural, que es lo que mejor entiende e5:
    // «Título: subtítulo. Libro de <categoría> sobre <temas>. Autor: <autores>.»
    // Las partes vacías se omiten (concat_ws ignora NULL). Medido con
    // `pnpm search:eval`: con los autores y la frase mejora sobre listas con etiquetas.
    const rows = await this.prisma.$queryRaw<StaleRow[]>(Prisma.sql`
      WITH base AS (
        SELECT w.id AS work_id,
          concat_ws(': ', w.title, w.subtitle) AS title,
          c.name AS category,
          (SELECT string_agg(a.name, ', ' ORDER BY wa.position, a.name)
             FROM work_authors wa JOIN authors a ON a.id = wa.author_id
            WHERE wa.work_id = w.id) AS authors,
          (SELECT string_agg(s.name, ', ' ORDER BY s.name)
             FROM work_subjects ws JOIN subjects s ON s.id = ws.subject_id
            WHERE ws.work_id = w.id) AS subjects
        FROM works w
        LEFT JOIN categories c ON c.id = w.category_id
        WHERE w.deleted_at IS NULL),
      src AS (
        SELECT work_id,
          concat_ws(' ',
            title || '.',
            CASE WHEN category IS NOT NULL OR subjects IS NOT NULL THEN
              'Libro' || coalesce(' de ' || category, '')
                      || coalesce(' sobre ' || subjects, '') || '.' END,
            'Autor: ' || authors || '.') AS source_text
        FROM base),
      cur AS (
        SELECT work_id, source_text,
               encode(sha256(convert_to(source_text, 'UTF8')), 'hex') AS source_hash
        FROM src)
      SELECT cur.work_id, cur.source_text, cur.source_hash
      FROM cur
      LEFT JOIN work_embeddings e ON e.work_id = cur.work_id
      WHERE e.work_id IS NULL
         OR e.model <> ${model}
         OR e.source_hash <> cur.source_hash
      ORDER BY cur.work_id
      LIMIT ${limit}`);
    return rows.map((r) => ({
      workId: r.work_id,
      sourceText: r.source_text,
      sourceHash: r.source_hash,
    }));
  }

  async save(
    workId: string,
    vector: readonly number[],
    model: string,
    sourceHash: string,
  ): Promise<void> {
    const literal = toVectorLiteral(vector);
    await this.prisma.$executeRaw`
      INSERT INTO work_embeddings (work_id, embedding, model, source_hash, updated_at)
      VALUES (${workId}::uuid, ${literal}::vector, ${model}, ${sourceHash}, now())
      ON CONFLICT (work_id) DO UPDATE SET
        embedding = EXCLUDED.embedding,
        model = EXCLUDED.model,
        source_hash = EXCLUDED.source_hash,
        updated_at = EXCLUDED.updated_at`;
  }

  async searchNearest(
    queryVector: readonly number[],
    limit: number,
    filters: NearestFilters = {},
  ): Promise<NearestWork[]> {
    const literal = toVectorLiteral(queryVector);
    // Mismas reglas que la búsqueda textual (PrismaSearchRepository).
    const conditions: Prisma.Sql[] = [Prisma.sql`w.deleted_at IS NULL`];
    if (filters.categoryId) {
      conditions.push(Prisma.sql`w.category_id = ${filters.categoryId}::uuid`);
    }
    if (filters.roomId || filters.onlyAvailable) {
      const copyConditions: Prisma.Sql[] = [
        Prisma.sql`c.work_id = w.id`,
        filters.onlyAvailable
          ? Prisma.sql`c.status = 'DISPONIBLE'`
          : Prisma.sql`c.status <> 'BAJA'`,
      ];
      if (filters.roomId) {
        copyConditions.push(Prisma.sql`se.room_id = ${filters.roomId}::uuid`);
      }
      conditions.push(Prisma.sql`EXISTS (
        SELECT 1 FROM copies c
        JOIN shelves sh ON sh.id = c.shelf_id
        JOIN sections se ON se.id = sh.section_id
        WHERE ${Prisma.join(copyConditions, ' AND ')})`);
    }
    const rows = await this.prisma.$queryRaw<NearestRow[]>(Prisma.sql`
      SELECT e.work_id,
             (1 - (e.embedding <=> ${literal}::vector))::float8 AS score
      FROM work_embeddings e
      JOIN works w ON w.id = e.work_id
      WHERE ${Prisma.join(conditions, ' AND ')}
      ORDER BY e.embedding <=> ${literal}::vector ASC, e.work_id ASC
      LIMIT ${limit}`);
    return rows.map((r) => ({ workId: r.work_id, score: r.score }));
  }
}
