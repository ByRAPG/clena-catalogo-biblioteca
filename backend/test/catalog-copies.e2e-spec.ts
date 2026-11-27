import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CopyStatus, PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ACCESS_TOKEN_VERIFIER } from '../src/modules/iam/application/ports/access-token-verifier';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';

/**
 * e2e de HU-11 (editar ubicación y estado de un ejemplar) y HU-19 (registrar
 * ejemplares) contra PostgreSQL real, en una base temporal con las migraciones.
 */
describe('Ejemplares: registrar y editar (e2e, HU-11 y HU-19)', () => {
  const fakeVerifier = {
    verifyAccessToken: async (token: string) => {
      if (token === 'test-staff')
        return { userId: randomUUID(), role: 'STAFF' as const };
      if (token === 'test-reader')
        return { userId: randomUUID(), role: 'READER' as const };
      return null;
    },
  };
  const STAFF = 'Bearer test-staff';
  const READER = 'Bearer test-reader';

  let app: INestApplication;
  let database: PrismaService;
  let adminClient: PrismaClient;
  let originalDatabaseUrl: string | undefined;
  const databaseName = `clena_copies_test_${randomUUID().replaceAll('-', '')}`;
  const http = () => request(app.getHttpServer());

  // Datos ficticios.
  let shelfA: string;
  let shelfB: string;
  let soloWorkId: string;
  let soloCopy: string;
  let loanedCopy: string;
  let importedLoanedCopy: string;
  let reservedCopy: string;
  let emptyWorkId: string;

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    if (!originalDatabaseUrl)
      throw new Error('DATABASE_URL es necesaria para las pruebas e2e');
    adminClient = new PrismaClient({ datasourceUrl: originalDatabaseUrl });
    await adminClient.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
    const url = new URL(originalDatabaseUrl);
    url.pathname = `/${databaseName}`;
    process.env.DATABASE_URL = url.toString();
    execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
      env: { ...process.env },
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ACCESS_TOKEN_VERIFIER)
      .useValue(fakeVerifier)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    database = app.get(PrismaService);

    const roomA = await database.room.create({
      data: { name: 'Sala General' },
    });
    const roomB = await database.room.create({ data: { name: 'Sala Norte' } });
    const sectionA = await database.section.create({
      data: { roomId: roomA.id, name: 'Narrativa' },
    });
    const sectionB = await database.section.create({
      data: { roomId: roomB.id, name: 'Historia' },
    });
    shelfA = (
      await database.shelf.create({
        data: { sectionId: sectionA.id, code: 'A-01' },
      })
    ).id;
    shelfB = (
      await database.shelf.create({
        data: { sectionId: sectionB.id, code: 'B-02' },
      })
    ).id;

    // Obra con un solo ejemplar: su disponibilidad depende solo de él.
    const soloWork = await database.work.create({
      data: { title: 'Obra ficticia única', searchText: 'obra ficticia unica' },
    });
    soloWorkId = soloWork.id;
    soloCopy = (
      await database.copy.create({
        data: {
          workId: soloWork.id,
          shelfId: shelfA,
          inventoryCode: 'CLENA-E2E-001',
          status: CopyStatus.DISPONIBLE,
        },
      })
    ).id;

    // Libro sin ejemplares para HU-19.
    emptyWorkId = (
      await database.work.create({
        data: {
          title: 'Obra ficticia sin ejemplares',
          searchText: 'obra ficticia sin ejemplares',
        },
      })
    ).id;

    const otherWork = await database.work.create({
      data: { title: 'Otra obra ficticia', searchText: 'otra obra ficticia' },
    });
    const reader = await database.reader.create({
      data: { fullName: 'Lectora Ficticia' },
    });
    const copy = (code: string, status: CopyStatus) =>
      database.copy.create({
        data: {
          workId: otherWork.id,
          shelfId: shelfA,
          inventoryCode: code,
          status,
        },
      });

    loanedCopy = (await copy('CLENA-E2E-002', CopyStatus.PRESTADO)).id;
    await database.loan.create({
      data: {
        copyId: loanedCopy,
        readerId: reader.id,
        dueAt: new Date(Date.now() + 7 * 86_400_000),
      },
    });
    // Importado como PRESTADO, sin préstamo registrado.
    importedLoanedCopy = (await copy('CLENA-E2E-003', CopyStatus.PRESTADO)).id;
    reservedCopy = (await copy('CLENA-E2E-004', CopyStatus.DISPONIBLE)).id;
    await database.reservation.create({
      data: {
        workId: otherWork.id,
        copyId: reservedCopy,
        readerId: reader.id,
        expiresAt: new Date(Date.now() + 86_400_000),
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

  const patch = (id: string, body: object, auth = STAFF) =>
    http()
      .patch(`/api/v1/catalog/copies/${id}`)
      .set('Authorization', auth)
      .send(body);

  const detail = async (workId: string) =>
    (await http().get(`/api/v1/search/works/${workId}`).expect(200)).body as {
      availability: { status: string; reason: string | null };
      copies: { inventoryCode: string; room: string; shelf: string }[];
    };

  it('responde 401 sin sesión y 403 a un lector', async () => {
    await http()
      .patch(`/api/v1/catalog/copies/${soloCopy}`)
      .send({ shelfId: shelfB })
      .expect(401);
    await patch(soloCopy, { shelfId: shelfB }, READER).expect(403);
    await http().get('/api/v1/catalog/shelves').expect(401);
    await http()
      .get('/api/v1/catalog/shelves')
      .set('Authorization', READER)
      .expect(403);
  });

  it('lista los estantes con su sección y sala', async () => {
    const res = await http()
      .get('/api/v1/catalog/shelves')
      .set('Authorization', STAFF)
      .expect(200);
    expect(res.body.data).toEqual([
      { id: shelfA, code: 'A-01', section: 'Narrativa', room: 'Sala General' },
      { id: shelfB, code: 'B-02', section: 'Historia', room: 'Sala Norte' },
    ]);
  });

  it('cambia el estante y la búsqueda muestra la ubicación nueva', async () => {
    const res = await patch(soloCopy, { shelfId: shelfB }).expect(200);
    expect(res.body).toEqual({
      id: soloCopy,
      inventoryCode: 'CLENA-E2E-001',
      status: 'DISPONIBLE',
      shelfId: shelfB,
      shelf: 'B-02',
      section: 'Historia',
      room: 'Sala Norte',
    });
    const obra = await detail(soloWorkId);
    expect(obra.copies[0]).toMatchObject({
      inventoryCode: 'CLENA-E2E-001',
      room: 'Sala Norte',
      shelf: 'B-02',
    });
  });

  it('en mantenimiento deja de contar como disponible', async () => {
    expect((await detail(soloWorkId)).availability.status).toBe('DISPONIBLE');
    await patch(soloCopy, { status: 'MANTENIMIENTO' }).expect(200);
    expect((await detail(soloWorkId)).availability).toMatchObject({
      status: 'NO_DISPONIBLE',
      reason: 'MANTENIMIENTO',
    });
    await patch(soloCopy, { status: 'DISPONIBLE' }).expect(200);
  });

  it('responde 409 si el ejemplar tiene un préstamo activo, pero sí lo mueve', async () => {
    const res = await patch(loanedCopy, { status: 'MANTENIMIENTO' }).expect(
      409,
    );
    expect(res.body.message).toBe(
      'El ejemplar está prestado; regístrelo como devuelto primero',
    );
    await patch(loanedCopy, { shelfId: shelfB }).expect(200);
  });

  it('corrige un ejemplar importado como PRESTADO sin préstamo', async () => {
    const res = await patch(importedLoanedCopy, {
      status: 'DISPONIBLE',
    }).expect(200);
    expect(res.body.status).toBe('DISPONIBLE');
  });

  it('responde 409 si el ejemplar tiene una reserva activa', async () => {
    await patch(reservedCopy, { status: 'BAJA' }).expect(409);
  });

  it.each([
    ['cuerpo vacío', {}],
    ['estado PRESTADO', { status: 'PRESTADO' }],
    ['estante que no es UUID', { shelfId: 'A-01' }],
    ['campo desconocido', { workId: randomUUID() }],
  ])('responde 400 con %s', async (_caso, body) => {
    await patch(soloCopy, body).expect(400);
  });

  it('responde 400 si el estante no existe', async () => {
    const res = await patch(soloCopy, { shelfId: randomUUID() }).expect(400);
    expect(res.body.message).toBe('El estante no existe');
  });

  it('responde 404 si el ejemplar no existe y 400 si el id no es UUID', async () => {
    await patch(randomUUID(), { status: 'BAJA' }).expect(404);
    await patch('no-es-uuid', { status: 'BAJA' }).expect(400);
  });

  describe('HU-19: registrar un ejemplar', () => {
    const register = (workId: string, body: object, auth = STAFF) =>
      http()
        .post(`/api/v1/catalog/works/${workId}/copies`)
        .set('Authorization', auth)
        .send(body);

    it('responde 401 sin sesión y 403 a un lector', async () => {
      await http()
        .post(`/api/v1/catalog/works/${emptyWorkId}/copies`)
        .send({ inventoryCode: 'X-1', shelfId: shelfA })
        .expect(401);
      await register(
        emptyWorkId,
        { inventoryCode: 'X-1', shelfId: shelfA },
        READER,
      ).expect(403);
    });

    it('registra el ejemplar y el detalle público muestra su ubicación', async () => {
      const res = await register(emptyWorkId, {
        inventoryCode: 'CLENA-E2E-100',
        shelfId: shelfB,
      }).expect(201);
      expect(res.body).toMatchObject({
        inventoryCode: 'CLENA-E2E-100',
        status: 'DISPONIBLE',
        shelfId: shelfB,
        room: 'Sala Norte',
        section: 'Historia',
        shelf: 'B-02',
      });
      const obra = await detail(emptyWorkId);
      expect(obra.availability.status).toBe('DISPONIBLE');
      expect(obra.copies).toEqual([
        expect.objectContaining({
          inventoryCode: 'CLENA-E2E-100',
          room: 'Sala Norte',
          shelf: 'B-02',
        }),
      ]);
    });

    it('no duplica un código de inventario existente', async () => {
      const antes = await database.copy.count();
      const res = await register(soloWorkId, {
        inventoryCode: 'CLENA-E2E-100',
        shelfId: shelfA,
      }).expect(409);
      expect(res.body.message).toContain('CLENA-E2E-100');
      expect(await database.copy.count()).toBe(antes);
    });

    it('dado de baja deja de contar como disponible', async () => {
      const copy = await database.copy.findUniqueOrThrow({
        where: { inventoryCode: 'CLENA-E2E-100' },
      });
      await patch(copy.id, { status: 'BAJA' }).expect(200);
      const obra = await detail(emptyWorkId);
      expect(obra.availability.status).toBe('NO_DISPONIBLE');
      expect(obra.copies).toEqual([]);
    });

    it('responde 404 si el libro no existe y 400 con datos inválidos', async () => {
      await register(randomUUID(), {
        inventoryCode: 'CLENA-E2E-200',
        shelfId: shelfA,
      }).expect(404);
      await register(emptyWorkId, {
        inventoryCode: 'CLENA-E2E-201',
        shelfId: randomUUID(),
      }).expect(400);
      await register(emptyWorkId, { shelfId: shelfA }).expect(400);
      await register(emptyWorkId, {
        inventoryCode: 'CLENA-E2E-202',
        shelfId: shelfA,
        status: 'PRESTADO',
      }).expect(400);
    });
  });
});
