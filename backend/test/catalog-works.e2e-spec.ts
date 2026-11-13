import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ACCESS_TOKEN_VERIFIER } from '../src/modules/iam/application/ports/access-token-verifier';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';

/**
 * e2e de HU-10 (registrar un libro) contra PostgreSQL real. Crea una base
 * temporal con las migraciones, como la e2e de importación, para no tocar la
 * semilla que leen las demás pruebas.
 */
const fakeVerifier = {
  verifyAccessToken: async (token: string) => {
    if (token === 'test-staff') return { userId: 'u1', role: 'STAFF' as const };
    if (token === 'test-admin') return { userId: 'u2', role: 'ADMIN' as const };
    if (token === 'test-reader')
      return { userId: 'u3', role: 'READER' as const };
    return null;
  },
};
const STAFF = 'Bearer test-staff';

describe('Registrar un libro (e2e, HU-10)', () => {
  let app: INestApplication;
  let database: PrismaService;
  let adminClient: PrismaClient;
  let originalDatabaseUrl: string | undefined;
  let categoryId: string;
  const databaseName = `clena_works_test_${randomUUID().replaceAll('-', '')}`;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    if (!originalDatabaseUrl)
      throw new Error('DATABASE_URL es necesaria para las pruebas e2e');
    adminClient = new PrismaClient({ datasourceUrl: originalDatabaseUrl });
    await adminClient.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
    const url = new URL(originalDatabaseUrl);
    url.pathname = `/${databaseName}`;
    process.env.DATABASE_URL = url.toString();
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
      env: { ...process.env },
      stdio: 'pipe',
    });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ACCESS_TOKEN_VERIFIER)
      .useValue(fakeVerifier)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    database = app.get(PrismaService);
    categoryId = (
      await database.category.create({
        data: { name: 'Literatura', normalizedName: 'literatura' },
      })
    ).id;
    await database.author.create({
      data: {
        name: 'Gabriel García Márquez',
        normalizedName: 'gabriel garcia marquez',
      },
    });
  }, 60000);

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

  const register = (body: object, auth = STAFF) =>
    http().post('/api/v1/catalog/works').set('Authorization', auth).send(body);

  it('registra el libro y aparece en la búsqueda pública', async () => {
    const res = await register({
      title: 'El otoño del patriarca',
      authors: ['gabriel garcia marquez'],
      subjects: ['Dictaduras', 'Novela'],
      categoryId,
      year: 1975,
    }).expect(201);
    expect(res.body).toEqual({
      id: expect.any(String),
      title: 'El otoño del patriarca',
    });

    const search = await http()
      .get('/api/v1/search/works')
      .query({ q: 'otoño del patriarca' })
      .expect(200);
    const found = (
      search.body.data as { id: string; authors: string[] }[]
    ).find((w) => w.id === res.body.id);
    expect(found).toBeDefined();
    // Reutiliza el autor existente, con su escritura original.
    expect(found?.authors).toEqual(['Gabriel García Márquez']);
    expect(await database.author.count()).toBe(1);
  });

  it('el administrador también puede registrar', async () => {
    await register(
      { title: 'Libro del administrador', authors: ['Autora Ficticia'] },
      'Bearer test-admin',
    ).expect(201);
  });

  it.each([
    [{ title: '   ', authors: ['Autora Ficticia'] }, /título/],
    [{ title: 'Sin autor', authors: [] }, /autor/],
    [{ title: 'Año malo', authors: ['A'], year: 99999 }, /año/],
  ])('responde 400 y no guarda: %j', async (body, message) => {
    const before = await database.work.count();
    const res = await register(body).expect(400);
    expect(String(res.body.message)).toMatch(message);
    expect(await database.work.count()).toBe(before);
  });

  it('responde 400 si la categoría no existe', async () => {
    await register({
      title: 'Otra obra',
      authors: ['A'],
      categoryId: randomUUID(),
    }).expect(400);
  });

  it('responde 401 sin sesión y 403 a un lector', async () => {
    await http()
      .post('/api/v1/catalog/works')
      .send({ title: 'T', authors: ['A'] })
      .expect(401);
    await register({ title: 'T', authors: ['A'] }, 'Bearer test-reader').expect(
      403,
    );
  });

  it('sugiere autores y temas existentes sin tildes ni mayúsculas', async () => {
    const authors = await http()
      .get('/api/v1/catalog/authors')
      .query({ q: 'GARCÍA' })
      .set('Authorization', STAFF)
      .expect(200);
    expect(authors.body.data).toEqual([
      { id: expect.any(String), name: 'Gabriel García Márquez' },
    ]);

    const subjects = await http()
      .get('/api/v1/catalog/subjects')
      .query({ q: 'dicta' })
      .set('Authorization', STAFF)
      .expect(200);
    expect(subjects.body.data.map((s: { name: string }) => s.name)).toEqual([
      'Dictaduras',
    ]);

    const tooShort = await http()
      .get('/api/v1/catalog/authors')
      .query({ q: 'g' })
      .set('Authorization', STAFF)
      .expect(200);
    expect(tooShort.body.data).toEqual([]);
  });
});
