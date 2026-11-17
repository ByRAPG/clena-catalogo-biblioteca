import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { configureApp } from '../src/app.setup';
import {
  EMBEDDING_GENERATOR,
  EmbeddingGenerator,
} from '../src/modules/search/application/ports/embedding-generator';
import { ReindexWorkEmbeddings } from '../src/modules/search/application/reindex-work-embeddings.use-case';
import { FakeEmbeddingGenerator } from '../src/modules/search/infrastructure/fake-embedding-generator';
import { SearchModule } from '../src/modules/search/search.module';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';
import { SharedModule } from '../src/shared/shared.module';

/**
 * e2e de la búsqueda híbrida contra PostgreSQL con pgvector y el generador
 * falso. Base temporal con migraciones. Se omite sin E2E_DATABASE_URL.
 */
const baseUrl = process.env.E2E_DATABASE_URL;
const describeDb = baseUrl ? describe : describe.skip;

interface Body {
  data: { id: string; title: string; matchedOn: string | null }[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    mode: string;
    degraded: boolean;
  };
}

describeDb('Búsqueda híbrida (e2e, pgvector)', () => {
  let app: INestApplication;
  let degradedApp: INestApplication;
  let adminClient: PrismaClient;
  const saved: Record<string, string | undefined> = {};
  const databaseName = `clena_hybrid_test_${randomUUID().replaceAll('-', '')}`;
  let cienciasId: string;
  let cocinaId: string;

  const get = async (
    target: INestApplication,
    query: Record<string, string | number>,
  ): Promise<Body> => {
    const res = await request(target.getHttpServer())
      .get('/api/v1/search/works')
      .query(query)
      .expect(200);
    return res.body as Body;
  };

  async function createApp(
    generator?: EmbeddingGenerator,
  ): Promise<INestApplication> {
    let builder = Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        SharedModule,
        SearchModule,
      ],
    });
    if (generator) {
      builder = builder
        .overrideProvider(EMBEDDING_GENERATOR)
        .useValue(generator);
    }
    const moduleRef = await builder.compile();
    const created = moduleRef.createNestApplication();
    configureApp(created);
    await created.init();
    return created;
  }

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

    app = await createApp();
    const db = app.get(PrismaService);
    const ciencias = await db.category.create({
      data: { name: 'Ciencias', normalizedName: 'ciencias' },
    });
    const cocina = await db.category.create({
      data: { name: 'Cocina', normalizedName: 'cocina' },
    });
    cienciasId = ciencias.id;
    cocinaId = cocina.id;
    const works: [string, string][] = [
      ['Ecología y medio ambiente', ciencias.id],
      ['Ecología urbana', cocina.id],
      ['Cocina casera', cocina.id],
      ['Recetas de pan', cocina.id],
      ['Astronomía básica', ciencias.id],
    ];
    for (const [title, categoryId] of works) {
      await db.work.create({
        data: { title, searchText: title.toLowerCase(), categoryId },
      });
    }
    await app.get(ReindexWorkEmbeddings).execute();

    const failing: EmbeddingGenerator = {
      embedQuery: () => Promise.reject(new Error('modelo caído')),
      embedPassages: () => Promise.reject(new Error('modelo caído')),
      status: () => new FakeEmbeddingGenerator().status(),
    };
    degradedApp = await createApp(failing);
  }, 120000);

  afterAll(async () => {
    if (degradedApp) await degradedApp.close();
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

  it('por defecto es híbrida y encuentra las obras de ecología primero', async () => {
    const body = await get(app, { q: 'ecologia' });
    expect(body.meta).toMatchObject({ mode: 'hybrid', degraded: false });
    expect(
      body.data
        .slice(0, 2)
        .map((w) => w.title)
        .sort(),
    ).toEqual(['Ecología urbana', 'Ecología y medio ambiente']);
    expect(body.data[0].matchedOn).toBe('title');
  });

  it('modo lexical: igual que antes, con total real', async () => {
    const body = await get(app, { q: 'ecologia', mode: 'lexical' });
    expect(body.meta).toMatchObject({ mode: 'lexical', degraded: false });
    expect(body.data.map((w) => w.title).sort()).toEqual([
      'Ecología urbana',
      'Ecología y medio ambiente',
    ]);
    expect(body.meta.total).toBe(2);
  });

  it('modo semantic: ordena todo el catálogo por cercanía', async () => {
    const body = await get(app, { q: 'ecologia', mode: 'semantic' });
    expect(body.meta).toMatchObject({
      mode: 'semantic',
      degraded: false,
      total: 5,
    });
    expect(body.data[0].title).toMatch(/^Ecología/);
    expect(body.data.every((w) => w.matchedOn === null)).toBe(true);
  });

  it.each(['hybrid', 'semantic'])(
    'el filtro de categoría también aplica al ranking semántico (%s)',
    async (mode) => {
      const body = await get(app, {
        q: 'ecologia',
        mode,
        categoryId: cienciasId,
      });
      expect(body.data.length).toBeGreaterThan(0);
      for (const w of body.data) {
        expect(['Ecología y medio ambiente', 'Astronomía básica']).toContain(
          w.title,
        );
      }
    },
  );

  it('pagina de forma estable sobre la lista fusionada', async () => {
    const all = await get(app, { q: 'ecologia', mode: 'semantic' });
    const p1 = await get(app, {
      q: 'ecologia',
      mode: 'semantic',
      pageSize: 2,
      page: 1,
    });
    const p2 = await get(app, {
      q: 'ecologia',
      mode: 'semantic',
      pageSize: 2,
      page: 2,
    });
    expect(p1.meta.total).toBe(5);
    expect([...p1.data, ...p2.data].map((w) => w.id)).toEqual(
      all.data.slice(0, 4).map((w) => w.id),
    );
  });

  it('sin texto o solo con filtros: comportamiento actual', async () => {
    const body = await get(app, { categoryId: cocinaId, mode: 'hybrid' });
    expect(body.meta).toMatchObject({
      mode: 'lexical',
      degraded: false,
      total: 3,
    });
  });

  it('rechaza un modo inválido con 400', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/search/works')
      .query({ q: 'x', mode: 'raro' })
      .expect(400);
  });

  it('si el generador falla responde la léxica con degraded y sin 500', async () => {
    for (const mode of ['hybrid', 'semantic']) {
      const body = await get(degradedApp, { q: 'ecologia', mode });
      expect(body.meta).toMatchObject({ mode: 'lexical', degraded: true });
      expect(body.data.length).toBe(2);
    }
    const byDefault = await get(degradedApp, { q: 'ecologia' });
    expect(byDefault.meta).toMatchObject({ mode: 'lexical', degraded: true });
  });
});
