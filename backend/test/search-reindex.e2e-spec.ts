import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { ReindexWorkEmbeddings } from '../src/modules/search/application/reindex-work-embeddings.use-case';
import { SearchModule } from '../src/modules/search/search.module';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';
import { SharedModule } from '../src/shared/shared.module';

/**
 * e2e del reindexado contra PostgreSQL real con pgvector y el generador falso.
 * Base temporal con migraciones. Se omite sin E2E_DATABASE_URL.
 */
const baseUrl = process.env.E2E_DATABASE_URL;
const describeDb = baseUrl ? describe : describe.skip;

describeDb('Reindexado de embeddings (e2e, pgvector)', () => {
  let app: INestApplication;
  let db: PrismaService;
  let reindex: ReindexWorkEmbeddings;
  let adminClient: PrismaClient;
  const saved: Record<string, string | undefined> = {};
  const databaseName = `clena_reindex_test_${randomUUID().replaceAll('-', '')}`;
  const workIds: string[] = [];

  const embeddingCount = async (): Promise<number> => {
    const [row] = await db.$queryRaw<
      { n: number }[]
    >`SELECT count(*)::int AS n FROM work_embeddings`;
    return row.n;
  };

  beforeAll(async () => {
    for (const key of [
      'DATABASE_URL',
      'SEMANTIC_SEARCH',
      'EMBEDDING_PROVIDER',
    ]) {
      saved[key] = process.env[key];
    }
    adminClient = new PrismaClient({ datasourceUrl: baseUrl });
    await adminClient.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
    const url = new URL(baseUrl as string);
    url.pathname = `/${databaseName}`;
    process.env.DATABASE_URL = url.toString();
    process.env.SEMANTIC_SEARCH = 'on';
    process.env.EMBEDDING_PROVIDER = 'fake';
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env },
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });
    // Solo SearchModule: sin programador, para controlar cuándo se reindexa.
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
    reindex = app.get(ReindexWorkEmbeddings);

    const category = await db.category.create({
      data: { name: 'Historia', normalizedName: 'historia' },
    });
    for (const title of ['Obra uno', 'Obra dos', 'Obra tres']) {
      const work = await db.work.create({
        data: {
          title,
          searchText: title.toLowerCase(),
          categoryId: category.id,
        },
      });
      workIds.push(work.id);
    }
  }, 90000);

  afterAll(async () => {
    if (app) await app.close();
    if (adminClient) {
      await adminClient.$executeRawUnsafe(
        `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`,
      );
      await adminClient.$disconnect();
    }
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('indexa todas las obras vigentes', async () => {
    const summary = await reindex.execute({ batchSize: 2 });
    expect(summary).toMatchObject({
      processed: 3,
      failed: 0,
      pending: 0,
      batches: 2,
      model: 'fake-ngram-hash',
    });
    expect(await embeddingCount()).toBe(3);
  });

  it('una segunda ejecución no procesa nada', async () => {
    const summary = await reindex.execute();
    expect(summary).toMatchObject({ processed: 0, batches: 0 });
  });

  it('al cambiar el título la obra se reprocesa y su hash cambia', async () => {
    const before = await db.workEmbedding.findUniqueOrThrow({
      where: { workId: workIds[0] },
    });
    await db.work.update({
      where: { id: workIds[0] },
      data: { title: 'Obra uno revisada' },
    });
    const summary = await reindex.execute();
    expect(summary.processed).toBe(1);
    const after = await db.workEmbedding.findUniqueOrThrow({
      where: { workId: workIds[0] },
    });
    expect(after.sourceHash).not.toBe(before.sourceHash);
    expect((await reindex.execute()).processed).toBe(0);
  });

  it('indexa una obra nueva y no considera las borradas', async () => {
    const nueva = await db.work.create({
      data: { title: 'Obra nueva', searchText: 'obra nueva' },
    });
    await db.work.update({
      where: { id: workIds[2] },
      data: { deletedAt: new Date() },
    });
    expect((await reindex.execute()).processed).toBe(1);
    const row = await db.workEmbedding.findUnique({
      where: { workId: nueva.id },
    });
    expect(row).not.toBeNull();
  });
});
