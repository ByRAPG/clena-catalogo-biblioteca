import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';

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
          String(9789990000000 + index),
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
      csvRow('BULK-0', 'Título que no debe guardarse', '9789990000028'),
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

  it('importa archivos de ejemplo UTF-8, UTF-8 con BOM, Windows-1252 con punto y coma y TSV con alias', async () => {
    const fixturesDir = join(process.cwd(), 'test/fixtures/import');
    const casos = [
      {
        fileName: 'utf8-sin-bom-comas.csv',
        expectedCode: 'FIX-UTF8-001',
        expectedTitle: 'Crónicas del puerto',
      },
      {
        fileName: 'utf8-con-bom.csv',
        expectedCode: 'FIX-BOM-001',
        expectedTitle: 'Memorias de la bahía',
      },
      {
        fileName: 'windows-1252-punto-y-coma.csv',
        expectedCode: 'FIX-WIN-001',
        expectedTitle: 'Crónica del año español',
      },
      {
        fileName: 'tabulador-alias-reordenado.tsv',
        expectedCode: 'FIX-TSV-001',
        expectedTitle: 'Atlas de mareas',
      },
    ];

    for (const caso of casos) {
      const contentBase64 = readFileSync(
        join(fixturesDir, caso.fileName),
      ).toString('base64');

      const response = await request(app.getHttpServer())
        .post('/api/v1/catalog/imports')
        .set('Authorization', `Bearer ${accessTokens.get('ADMIN')}`)
        .send({ fileName: caso.fileName, contentBase64 })
        .expect(200);

      expect(response.body).toMatchObject({
        created: 1,
        updated: 0,
        failed: 0,
      });
      const copy = await database.copy.findUniqueOrThrow({
        where: { inventoryCode: caso.expectedCode },
        include: { work: true },
      });
      expect(copy.work.title).toBe(caso.expectedTitle);
    }
  });

  it('rechaza archivos que superan el límite de filas o de tamaño y reporta campos demasiado largos', async () => {
    const tooManyRows = [
      'titulo,sala,seccion,estante,codigo_ejemplar',
      ...Array.from({ length: 5001 }, (_, i) => `L${i},S,Se,E,LIM-${i}`),
    ].join('\n');

    const rowsResponse = await importCsv(tooManyRows).expect(400);
    expect(String(rowsResponse.body.message)).toContain('5000');

    const tooLarge = 'a'.repeat(1_000_001);
    const sizeResponse = await importCsv(tooLarge).expect(400);
    expect(String(sizeResponse.body.message)).toContain('1 MB');

    const fieldTooLong = await importCsv(
      [
        HEADER,
        csvRow('LONG-BAD', 't'.repeat(301)),
        csvRow('LONG-OK', 'Título válido'),
      ].join('\n'),
    ).expect(200);

    expect(fieldTooLong.body).toMatchObject({
      created: 1,
      updated: 0,
      failed: 1,
    });
    expect(fieldTooLong.body.rows[0]).toMatchObject({
      row: 2,
      status: 'failed',
      field: 'titulo',
    });
  });

  it('simula obras y ejemplares sin escribir en BD y sin detenerse ante filas inválidas', async () => {
    const worksBefore = await database.work.count();
    const copiesBefore = await database.copy.count();
    const jobsBefore = await database.importJob.count();

    await request(app.getHttpServer())
      .post('/api/v1/catalog/imports/preview')
      .send({ fileName: 'catalogo.csv', content: HEADER })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/catalog/imports/preview')
      .set('Authorization', `Bearer ${accessTokens.get('STAFF')}`)
      .send({ fileName: 'catalogo.csv', content: HEADER })
      .expect(403);

    const simulationCsv = [
      HEADER,
      csvRow('SIM-NEW-1', 'Obra simulada', '9789991111111'),
      csvRow('SIM-NEW-2', 'Obra simulada', '9789991111111'),
      csvRow('SIM-BAD-TITLE', ''),
      csvRow('BULK-0', 'Obra existente actualizada', '9789990000000'),
      csvRow('BULK-0', 'Conflicto de ISBN', '9789990000028'),
    ].join('\n');

    const response = await request(app.getHttpServer())
      .post('/api/v1/catalog/imports/preview')
      .set('Authorization', `Bearer ${accessTokens.get('ADMIN')}`)
      .send({ fileName: 'simulacion.csv', content: simulationCsv })
      .expect(200);

    expect(response.body).toMatchObject({
      dryRun: true,
      created: 2,
      updated: 1,
      failed: 2,
      works: { created: 1, updated: 1 },
      copies: { created: 2, updated: 1 },
    });
    expect(response.body.importId).toBeUndefined();
    expect(
      response.body.rows.map((row: { row: number; status: string }) => [
        row.row,
        row.status,
      ]),
    ).toEqual([
      [2, 'created'],
      [3, 'created'],
      [4, 'failed'],
      [5, 'updated'],
      [6, 'failed'],
    ]);

    expect(await database.work.count()).toBe(worksBefore);
    expect(await database.copy.count()).toBe(copiesBefore);
    expect(await database.importJob.count()).toBe(jobsBefore);
    expect(
      await database.copy.findUnique({ where: { inventoryCode: 'SIM-NEW-1' } }),
    ).toBeNull();
  });

  it('descarga el informe de errores en CSV desde la simulación y desde una importación guardada', async () => {
    const mixedCsv = [
      HEADER,
      csvRow('ERR-CSV-OK', 'Libro válido para reporte'),
      csvRow('ERR-CSV-BAD', ''),
      'Fila incompleta',
    ].join('\n');

    const previewErrors = await request(app.getHttpServer())
      .post('/api/v1/catalog/imports/preview/errors')
      .set('Authorization', `Bearer ${accessTokens.get('ADMIN')}`)
      .send({ fileName: 'simulacion.csv', content: mixedCsv })
      .expect(200);

    expect(previewErrors.headers['content-type']).toContain('text/csv');
    expect(previewErrors.headers['content-disposition']).toContain(
      'errores-simulacion.csv',
    );
    expect(previewErrors.text).toContain('fila,campo,error\n');
    expect(previewErrors.text).toContain(
      '3,titulo,El campo titulo es obligatorio',
    );
    expect(previewErrors.text).toContain('4,,');
    expect(
      await database.copy.findUnique({
        where: { inventoryCode: 'ERR-CSV-OK' },
      }),
    ).toBeNull();

    const imported = await importCsv(mixedCsv).expect(200);
    const importId = imported.body.importId as string;
    expect(importId).toEqual(expect.any(String));
    expect(imported.body).toMatchObject({
      dryRun: false,
      works: { created: 1, updated: 0 },
      copies: { created: 1, updated: 0 },
    });

    const jobErrors = await request(app.getHttpServer())
      .get(`/api/v1/catalog/imports/${importId}/errors`)
      .set('Authorization', `Bearer ${accessTokens.get('ADMIN')}`)
      .expect(200);

    expect(jobErrors.headers['content-type']).toContain('text/csv');
    expect(jobErrors.headers['content-disposition']).toContain(
      `errores-importacion-${importId}.csv`,
    );
    expect(jobErrors.text).toContain('fila,campo,error\n');
    expect(jobErrors.text).toContain('3,titulo,El campo titulo es obligatorio');

    await request(app.getHttpServer())
      .get(`/api/v1/catalog/imports/${randomUUID()}/errors`)
      .set('Authorization', `Bearer ${accessTokens.get('ADMIN')}`)
      .expect(404);

    await request(app.getHttpServer())
      .get('/api/v1/catalog/imports/no-es-uuid/errors')
      .set('Authorization', `Bearer ${accessTokens.get('ADMIN')}`)
      .expect(400);

    await request(app.getHttpServer())
      .get(`/api/v1/catalog/imports/${importId}/errors`)
      .set('Authorization', `Bearer ${accessTokens.get('STAFF')}`)
      .expect(403);
  });
});
