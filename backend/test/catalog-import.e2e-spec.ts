import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';
import { isbnFicticio } from '../prisma/data/catalogo';

const HEADER =
  'titulo,autor,tema,isbn,clasificacion,anio,editorial,categoria,sala,seccion,estante,codigo_ejemplar,estado,url_digital';

function csvRow(code: string, title = 'Libro ficticio', isbn = ''): string {
  return [
    title,
    'Autora Ficticia;Otra Autora',
    'Tema Ficticio',
    isbn,
    '863',
    '2024',
    'Editorial Ficticia',
    'Literatura',
    'Sala Prueba',
    'Sección Prueba',
    'P-01',
    code,
    'DISPONIBLE',
    '',
  ].join(',');
}

describe('Importación CSV con PostgreSQL (e2e)', () => {
  let app: INestApplication;
  let database: PrismaService;
  let adminClient: PrismaClient;
  let userId: string;
  const accessTokens = new Map<string, string>();
  let originalDatabaseUrl: string | undefined;
  const databaseName = `clena_import_test_${randomUUID().replaceAll('-', '')}`;

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
      shell: process.platform === 'win32',
    });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    database = app.get(PrismaService);
    const password = randomUUID();
    const passwordHash = await hash(password);
    for (const role of ['ADMIN', 'STAFF', 'READER'] as const) {
      const email = `${role.toLowerCase()}@example.org`;
      const user = await database.user.create({
        data: {
          email,
          fullName: `Usuario ficticio ${role}`,
          passwordHash,
          role,
        },
      });
      if (role === 'ADMIN') userId = user.id;
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password })
        .expect(200);
      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.usuario.rol).toBe(role);
      accessTokens.set(role, response.body.accessToken as string);
    }
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

  function importCsv(content: string) {
    return request(app.getHttpServer())
      .post('/api/v1/catalog/imports')
      .set('Authorization', `Bearer ${accessTokens.get('ADMIN')}`)
      .send({ fileName: 'catalogo.csv', content });
  }

  it('sirve la plantilla existente sin autenticación', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/catalog/imports/template')
      .expect(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain(
      'plantilla-catalogo.csv',
    );
    expect(response.text).toContain(HEADER);
  });

  it('rechaza usuarios anónimos', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/catalog/imports')
      .send({ fileName: 'catalogo.csv', content: HEADER })
      .expect(401);
    expect(await database.importJob.count()).toBe(0);
  });

  it('rechaza un token inválido', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/catalog/imports')
      .set('Authorization', 'Bearer invalid')
      .send({ fileName: 'catalogo.csv', content: HEADER })
      .expect(401);
    expect(await database.importJob.count()).toBe(0);
  });

  it.each(['STAFF', 'READER'])(
    'rechaza el rol %s con sesión real',
    async (role) => {
      await request(app.getHttpServer())
        .post('/api/v1/catalog/imports')
        .set('Authorization', `Bearer ${accessTokens.get(role)}`)
        .send({ fileName: 'catalogo.csv', content: HEADER })
        .expect(403);
      expect(await database.importJob.count()).toBe(0);
    },
  );

  it('rechaza un archivo inválido y un userId enviado por el cliente', async () => {
    await importCsv('cabecera incorrecta').expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/catalog/imports')
      .set('Authorization', `Bearer ${accessTokens.get('ADMIN')}`)
      .send({ fileName: 'catalogo.csv', content: HEADER, userId: randomUUID() })
      .expect(400);
    expect(await database.importJob.count()).toBe(0);
  });

  it('importa 500 filas y las actualiza al repetir sin duplicar obras ni relaciones', async () => {
    const content = [
      HEADER,
      ...Array.from({ length: 500 }, (_, index) =>
        csvRow(
          `BULK-${index}`,
          `Obra ficticia ${index}`,
          isbnFicticio(index + 100),
        ),
      ),
    ].join('\n');
    const first = await importCsv(content).expect(200);
    expect(first.body).toMatchObject({ created: 500, updated: 0, failed: 0 });
    expect(first.body.rows).toHaveLength(500);
    const second = await importCsv(content).expect(200);
    expect(second.body).toMatchObject({ created: 0, updated: 500, failed: 0 });
    expect(await database.copy.count()).toBe(500);
    expect(await database.work.count()).toBe(500);
    expect(await database.author.count()).toBe(2);
    expect(await database.workAuthor.count()).toBe(1000);
    expect(await database.subject.count()).toBe(1);
    expect(await database.workSubject.count()).toBe(500);
  }, 60000);

  it('reporta errores de filas intermedias y conserva las válidas y el historial', async () => {
    const response = await importCsv(
      [
        HEADER,
        csvRow('PARTIAL-1'),
        csvRow('PARTIAL-INVALID', ''),
        'Fila incompleta',
        csvRow('PARTIAL-2'),
      ].join('\n'),
    ).expect(200);
    expect(response.body).toMatchObject({ created: 2, updated: 0, failed: 2 });
    expect(
      response.body.rows.map((row: { row: number; status: string }) => [
        row.row,
        row.status,
      ]),
    ).toEqual([
      [2, 'created'],
      [3, 'failed'],
      [4, 'failed'],
      [5, 'created'],
    ]);
    expect(
      await database.copy.count({
        where: { inventoryCode: { startsWith: 'PARTIAL-' } },
      }),
    ).toBe(2);
    const job = await database.importJob.findFirstOrThrow({
      orderBy: { createdAt: 'desc' },
    });
    expect(job).toMatchObject({
      userId,
      fileName: 'catalogo.csv',
      created: 2,
      failed: 2,
    });
    expect(job.errors).toHaveLength(2);
  });

  it('reutiliza obras sin ISBN para ejemplares de la misma edición y al repetir la carga', async () => {
    const content = [
      HEADER,
      csvRow('NOISBN-1', 'Edición sin ISBN'),
      csvRow('NOISBN-2', 'Edición sin ISBN'),
    ].join('\n');
    await importCsv(content).expect(200);
    const response = await importCsv(content).expect(200);
    expect(response.body).toMatchObject({ created: 0, updated: 2, failed: 0 });
    expect(
      await database.work.count({ where: { title: 'Edición sin ISBN' } }),
    ).toBe(1);
  });

  it('reporta conflicto de ejemplar sin modificar la obra ni impedir la siguiente fila', async () => {
    const content = [
      HEADER,
      csvRow('BULK-0', 'Título que no debe guardarse', isbnFicticio(999)),
      csvRow('AFTER-CONFLICT', 'Otra obra'),
    ].join('\n');
    const response = await importCsv(content).expect(200);
    expect(response.body).toMatchObject({ created: 1, failed: 1 });
    expect(
      await database.work.count({
        where: { title: 'Título que no debe guardarse' },
      }),
    ).toBe(0);
    expect(
      await database.copy.findUnique({
        where: { inventoryCode: 'AFTER-CONFLICT' },
      }),
    ).not.toBeNull();
  });

  it('importa la plantilla oficial sin errores y de forma idempotente', async () => {
    const template = await request(app.getHttpServer())
      .get('/api/v1/catalog/imports/template')
      .expect(200);

    const first = await importCsv(template.text).expect(200);
    expect(first.body).toMatchObject({ created: 3, updated: 0, failed: 0 });

    const second = await importCsv(template.text).expect(200);
    expect(second.body).toMatchObject({ created: 0, updated: 3, failed: 0 });
  });

  it('valida ISBN-10 e ISBN-13 y normaliza guiones de forma idempotente', async () => {
    const isbn13 = isbnFicticio(901);
    const hyphenated = `${isbn13.slice(0, 3)}-${isbn13.slice(3, 6)}-${isbn13.slice(6, 12)}-${isbn13.slice(12)}`;

    const first = await importCsv(
      [
        HEADER,
        csvRow('ISBN-BAD', 'Obra con ISBN inválido', '9789990000019'),
        csvRow('ISBN-13-OK', 'Obra con ISBN-13', hyphenated),
        csvRow('ISBN-10-OK', 'Obra con ISBN-10', '0-8044-2957-x'),
      ].join('\n'),
    ).expect(200);

    expect(first.body).toMatchObject({ created: 2, updated: 0, failed: 1 });
    expect(first.body.rows[0]).toMatchObject({
      row: 2,
      status: 'failed',
      field: 'isbn',
    });

    const second = await importCsv(
      [
        HEADER,
        csvRow('ISBN-13-OK', 'Obra con ISBN-13', isbn13),
        csvRow('ISBN-10-OK', 'Obra con ISBN-10', '080442957X'),
      ].join('\n'),
    ).expect(200);

    expect(second.body).toMatchObject({ created: 0, updated: 2, failed: 0 });
    expect(await database.work.count({ where: { isbn: isbn13 } })).toBe(1);
    expect(await database.work.count({ where: { isbn: '080442957X' } })).toBe(
      1,
    );
  });

  it('neutraliza fórmulas (=, +, -, @) al persistir y mantiene idempotencia al reimportar', async () => {
    const csv = [
      HEADER,
      [
        '"=HYPERLINK(""https://example.org"")"',
        '+Autor Uno;-Autor Dos',
        '@Tema Peligroso',
        '',
        '=863',
        '2024',
        '+Editorial',
        '-Literatura',
        '@Sala Formula',
        '=Seccion Formula',
        '+F-01',
        'FORMULA-001',
        'DISPONIBLE',
        '',
      ].join(','),
    ].join('\n');

    const first = await importCsv(csv).expect(200);
    expect(first.body).toMatchObject({ created: 1, updated: 0, failed: 0 });

    const copy = await database.copy.findUniqueOrThrow({
      where: { inventoryCode: 'FORMULA-001' },
      include: {
        work: {
          include: {
            category: true,
            authors: {
              include: { author: true },
              orderBy: { position: 'asc' },
            },
            subjects: { include: { subject: true } },
          },
        },
        shelf: { include: { section: { include: { room: true } } } },
      },
    });

    expect(copy.work.title).toBe('\'=HYPERLINK("https://example.org")');
    expect(copy.work.classification).toBe("'=863");
    expect(copy.work.publisher).toBe("'+Editorial");
    expect(copy.work.category?.name).toBe("'-Literatura");
    expect(copy.work.authors.map((a) => a.author.name)).toEqual([
      "'+Autor Uno",
      "'-Autor Dos",
    ]);
    expect(copy.work.subjects.map((s) => s.subject.name)).toEqual([
      "'@Tema Peligroso",
    ]);
    expect(copy.shelf.code).toBe("'+F-01");
    expect(copy.shelf.section.name).toBe("'=Seccion Formula");
    expect(copy.shelf.section.room.name).toBe("'@Sala Formula");

    const second = await importCsv(csv).expect(200);
    expect(second.body).toMatchObject({ created: 0, updated: 1, failed: 0 });
    expect(
      await database.work.count({
        where: { title: '\'=HYPERLINK("https://example.org")' },
      }),
    ).toBe(1);
  });
});
