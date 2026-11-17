import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import {
  WORK_EMBEDDING_REPOSITORY,
  WorkEmbeddingRepository,
} from '../src/modules/search/application/ports/work-embedding.repository';
import { SearchModule } from '../src/modules/search/search.module';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';
import { SharedModule } from '../src/shared/shared.module';

/**
 * e2e del repositorio de embeddings contra PostgreSQL real con pgvector.
 * Crea una base temporal con las migraciones (no toca la semilla). Se omite
 * si no hay E2E_DATABASE_URL:
 *   E2E_DATABASE_URL=postgresql://postgres:tmp@localhost:55440/clena?schema=public pnpm run test:e2e
 */
const baseUrl = process.env.E2E_DATABASE_URL;
const describeDb = baseUrl ? describe : describe.skip;

const MODEL = 'modelo-prueba@1';
const DIMENSIONS = 384;

/** Vector unitario con 1 en la posición `axis` (más `mix` en la siguiente). */
const axisVector = (axis: number, mix = 0): number[] => {
  const v = new Array<number>(DIMENSIONS).fill(0);
  v[axis] = 1;
  if (mix) v[axis + 1] = mix;
  return v;
};

describeDb('Embeddings de obras (e2e, pgvector)', () => {
  let app: INestApplication;
  let repo: WorkEmbeddingRepository;
  let db: PrismaService;
  let adminClient: PrismaClient;
  let originalDatabaseUrl: string | undefined;
  const databaseName = `clena_emb_test_${randomUUID().replaceAll('-', '')}`;
  const ids: Record<'a' | 'b' | 'c', string> = { a: '', b: '', c: '' };
  let categoryId: string;

  const embeddingCount = async (): Promise<number> => {
    const [row] = await db.$queryRaw<
      { n: number }[]
    >`SELECT count(*)::int AS n FROM work_embeddings`;
    return row.n;
  };

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    adminClient = new PrismaClient({ datasourceUrl: baseUrl });
    await adminClient.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
    const url = new URL(baseUrl as string);
    url.pathname = `/${databaseName}`;
    process.env.DATABASE_URL = url.toString();
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env },
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        SharedModule,
        SearchModule,
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    db = app.get(PrismaService);
    repo = app.get<WorkEmbeddingRepository>(WORK_EMBEDDING_REPOSITORY);

    categoryId = (
      await db.category.create({
        data: { name: 'Literatura', normalizedName: 'literatura' },
      })
    ).id;
    const author = await db.author.create({
      data: { name: 'Ana Autora', normalizedName: 'ana autora' },
    });
    const subject = await db.subject.create({
      data: { name: 'Novela', normalizedName: 'novela' },
    });
    const mk = async (title: string, withCategory: boolean) =>
      (
        await db.work.create({
          data: {
            title,
            searchText: title.toLowerCase(),
            categoryId: withCategory ? categoryId : null,
            authors: { create: { authorId: author.id, position: 0 } },
            subjects: { create: { subjectId: subject.id } },
          },
        })
      ).id;
    ids.a = await mk('Obra A', true);
    ids.b = await mk('Obra B', false);
    ids.c = await mk('Obra C', true);
  }, 90000);

  afterAll(async () => {
    if (app) await app.close();
    if (adminClient) {
      await adminClient.$executeRawUnsafe(
        `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`,
      );
      await adminClient.$disconnect();
    }
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('todas las obras están obsoletas al inicio, con texto fuente y hash', async () => {
    const stale = await repo.findStale(MODEL, 10);
    expect(stale.map((s) => s.workId).sort()).toEqual(
      [ids.a, ids.b, ids.c].sort(),
    );
    const a = stale.find((s) => s.workId === ids.a);
    expect(a?.sourceText).toBe(
      'Obra A. Libro de Literatura sobre Novela. Autor: Ana Autora.',
    );
    expect(a?.sourceHash).toMatch(/^[0-9a-f]{64}$/);
    const b = stale.find((s) => s.workId === ids.b);
    expect(b?.sourceText).toBe(
      'Obra B. Libro sobre Novela. Autor: Ana Autora.',
    );
    expect(await repo.findStale(MODEL, 2)).toHaveLength(2);
  });

  it('guarda vectores y deja de listar las obras al día', async () => {
    for (const [key, vec] of [
      ['a', axisVector(0)],
      ['b', axisVector(1)],
      ['c', axisVector(0, 1)],
    ] as const) {
      const [s] = (await repo.findStale(MODEL, 10)).filter(
        (x) => x.workId === ids[key],
      );
      await repo.save(ids[key], vec, MODEL, s.sourceHash);
    }
    expect(await embeddingCount()).toBe(3);
    expect(await repo.findStale(MODEL, 10)).toEqual([]);
  });

  it('save hace upsert: reemplaza el vector sin duplicar la fila', async () => {
    const before = await db.workEmbedding.findUniqueOrThrow({
      where: { workId: ids.b },
    });
    await new Promise((r) => setTimeout(r, 5));
    await repo.save(ids.b, axisVector(2), MODEL, before.sourceHash);
    expect(await embeddingCount()).toBe(3);
    const after = await db.workEmbedding.findUniqueOrThrow({
      where: { workId: ids.b },
    });
    expect(after.updatedAt.getTime()).toBeGreaterThan(
      before.updatedAt.getTime(),
    );
    const nearest = await repo.searchNearest(axisVector(2), 1);
    expect(nearest[0].workId).toBe(ids.b);
  });

  it('detecta obras obsoletas por modelo distinto o texto cambiado', async () => {
    expect((await repo.findStale('otro-modelo@2', 10)).length).toBe(3);

    await db.work.update({ where: { id: ids.a }, data: { title: 'Obra A2' } });
    const stale = await repo.findStale(MODEL, 10);
    expect(stale.map((s) => s.workId)).toEqual([ids.a]);

    await db.work.update({
      where: { id: ids.a },
      data: { deletedAt: new Date() },
    });
    expect(await repo.findStale(MODEL, 10)).toEqual([]);
    await db.work.update({
      where: { id: ids.a },
      data: { deletedAt: null },
    });
  });

  it('devuelve los vecinos por distancia coseno, del más cercano al más lejano', async () => {
    // a = e0, c = e0 + e1 (45 grados), b = e2 (ortogonal)
    const res = await repo.searchNearest(axisVector(0), 10);
    expect(res.map((r) => r.workId)).toEqual([ids.a, ids.c, ids.b]);
    expect(res[0].score).toBeCloseTo(1, 5);
    expect(res[1].score).toBeCloseTo(Math.SQRT1_2, 5);
    expect(res[2].score).toBeCloseTo(0, 5);
    expect(await repo.searchNearest(axisVector(0), 2)).toHaveLength(2);
  });

  it('aplica los filtros de categoría y excluye obras borradas', async () => {
    const res = await repo.searchNearest(axisVector(0), 10, { categoryId });
    expect(res.map((r) => r.workId)).toEqual([ids.a, ids.c]);

    await db.work.update({
      where: { id: ids.a },
      data: { deletedAt: new Date() },
    });
    const sinA = await repo.searchNearest(axisVector(0), 10);
    expect(sinA.map((r) => r.workId)).not.toContain(ids.a);
    await db.work.update({ where: { id: ids.a }, data: { deletedAt: null } });

    // Sin ejemplares disponibles, el filtro de disponibilidad no devuelve nada.
    expect(
      await repo.searchNearest(axisVector(0), 10, { onlyAvailable: true }),
    ).toEqual([]);
  });

  it('rechaza vectores inválidos antes de escribir', async () => {
    await expect(repo.save(ids.a, [1, 2, 3], MODEL, 'h')).rejects.toThrow(
      '384 dimensiones',
    );
    const withNaN = axisVector(0);
    withNaN[5] = NaN;
    await expect(repo.save(ids.a, withNaN, MODEL, 'h')).rejects.toThrow(
      'finitos',
    );
    await expect(repo.searchNearest([1], 3)).rejects.toThrow('384');
  });

  it('borra el vector en cascada al eliminar la obra', async () => {
    await db.work.delete({ where: { id: ids.c } });
    expect(await embeddingCount()).toBe(2);
    const res = await repo.searchNearest(axisVector(0), 10);
    expect(res.map((r) => r.workId)).not.toContain(ids.c);
  });
});
