import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CopyStatus, PrismaClient, Role } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ACCESS_TOKEN_VERIFIER } from '../src/modules/iam/application/ports/access-token-verifier';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';

/**
 * e2e de HU-20 (préstamos y devoluciones) contra PostgreSQL real en una base
 * temporal con las migraciones aplicadas.
 */
describe('Préstamos y devoluciones (e2e, HU-20)', () => {
  const staffUserId = randomUUID();
  const adminUserId = randomUUID();
  const readerUserId = randomUUID();

  const fakeVerifier = {
    verifyAccessToken: async (token: string) => {
      if (token === 'test-staff')
        return { userId: staffUserId, role: 'STAFF' as const };
      if (token === 'test-admin')
        return { userId: adminUserId, role: 'ADMIN' as const };
      if (token === 'test-reader')
        return { userId: readerUserId, role: 'READER' as const };
      return null;
    },
  };

  const STAFF = 'Bearer test-staff';
  const READER = 'Bearer test-reader';

  let app: INestApplication;
  let database: PrismaService;
  let adminClient: PrismaClient;
  let originalDatabaseUrl: string | undefined;
  let availableCopyId: string;
  let maintenanceCopyId: string;
  let readerId: string;
  const databaseName = `clena_loans_test_${randomUUID().replaceAll('-', '')}`;
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

    await database.user.create({
      data: {
        id: staffUserId,
        email: 'bibliotecaria@example.org',
        passwordHash: 'hash',
        fullName: 'Marta Bibliotecaria',
        role: Role.STAFF,
      },
    });

    const reader = await database.reader.create({
      data: {
        fullName: 'Carmen Pérez',
        documentId: '1045000111',
        email: 'carmen@example.org',
      },
    });
    readerId = reader.id;

    const room = await database.room.create({ data: { name: 'Sala General' } });
    const section = await database.section.create({
      data: { roomId: room.id, name: 'Narrativa' },
    });
    const shelf = await database.shelf.create({
      data: { sectionId: section.id, code: 'E-01' },
    });
    const work = await database.work.create({
      data: {
        title: 'Cien años de soledad',
        searchText: 'cien anos de soledad',
      },
    });

    const copy1 = await database.copy.create({
      data: {
        workId: work.id,
        shelfId: shelf.id,
        inventoryCode: 'CLENA-LOAN-001',
        status: CopyStatus.DISPONIBLE,
      },
    });
    availableCopyId = copy1.id;

    const copy2 = await database.copy.create({
      data: {
        workId: work.id,
        shelfId: shelf.id,
        inventoryCode: 'CLENA-LOAN-002',
        status: CopyStatus.MANTENIMIENTO,
      },
    });
    maintenanceCopyId = copy2.id;
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

  it('impide el acceso sin sesión o con rol READER', async () => {
    await http().get('/api/v1/loans').expect(401);
    await http().get('/api/v1/loans').set('Authorization', READER).expect(403);
    await http()
      .post('/api/v1/loans')
      .set('Authorization', READER)
      .send({ copyId: availableCopyId, readerId })
      .expect(403);
  });

  it('permite buscar lectores, registrar uno nuevo y buscar ejemplares', async () => {
    const readersRes = await http()
      .get('/api/v1/loans/readers?q=carmen')
      .set('Authorization', STAFF)
      .expect(200);
    expect(readersRes.body.data).toHaveLength(1);
    expect(readersRes.body.data[0].fullName).toBe('Carmen Pérez');

    const createdReader = await http()
      .post('/api/v1/loans/readers')
      .set('Authorization', STAFF)
      .send({ fullName: 'Andrés Estudiante', documentId: '2026001' })
      .expect(201);
    expect(createdReader.body.fullName).toBe('Andrés Estudiante');

    const copiesRes = await http()
      .get('/api/v1/loans/copies?q=CLENA-LOAN')
      .set('Authorization', STAFF)
      .expect(200);
    expect(copiesRes.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('registra préstamo, impide doble préstamo, y devuelve el ejemplar a DISPONIBLE', async () => {
    // 1. Registrar préstamo de ejemplar disponible
    const created = await http()
      .post('/api/v1/loans')
      .set('Authorization', STAFF)
      .send({
        inventoryCode: 'CLENA-LOAN-001',
        readerId,
        loanDays: 10,
      })
      .expect(201);

    const loanId: string = created.body.id;
    expect(created.body.active).toBe(true);
    expect(created.body.copy.status).toBe('PRESTADO');
    expect(created.body.reader.id).toBe(readerId);
    expect(created.body.staff.id).toBe(staffUserId);

    const loanedAt = new Date(created.body.loanedAt).getTime();
    const dueAt = new Date(created.body.dueAt).getTime();
    expect(Math.round((dueAt - loanedAt) / (24 * 60 * 60 * 1000))).toBe(10);

    // 2. Intentar prestar de nuevo el mismo ejemplar -> 409 Conflict
    const duplicate = await http()
      .post('/api/v1/loans')
      .set('Authorization', STAFF)
      .send({ copyId: availableCopyId, readerId })
      .expect(409);
    expect(duplicate.body.message).toMatch(/prestado/i);

    // 3. Intentar prestar un ejemplar en mantenimiento -> 409 Conflict
    const maintenance = await http()
      .post('/api/v1/loans')
      .set('Authorization', STAFF)
      .send({ copyId: maintenanceCopyId, readerId })
      .expect(409);
    expect(maintenance.body.message).toMatch(/mantenimiento/i);

    // 4. Aparece en la lista de préstamos activos
    const listActive = await http()
      .get('/api/v1/loans?status=active')
      .set('Authorization', STAFF)
      .expect(200);
    expect(listActive.body.total).toBe(1);
    expect(listActive.body.data[0].id).toBe(loanId);

    // 5. Registrar devolución -> ejemplar vuelve a DISPONIBLE
    const returned = await http()
      .post(`/api/v1/loans/${loanId}/return`)
      .set('Authorization', STAFF)
      .expect(200);
    expect(returned.body.active).toBe(false);
    expect(returned.body.returnedAt).toBeTruthy();
    expect(returned.body.copy.status).toBe('DISPONIBLE');

    // 6. Intentar devolverlo una segunda vez -> 409 Conflict
    await http()
      .post(`/api/v1/loans/${loanId}/return`)
      .set('Authorization', STAFF)
      .expect(409);

    // 7. Se puede volver a prestar ahora que está disponible
    const secondLoan = await http()
      .post('/api/v1/loans')
      .set('Authorization', STAFF)
      .send({ copyId: availableCopyId, readerId })
      .expect(201);
    expect(secondLoan.body.id).not.toBe(loanId);
    expect(secondLoan.body.copy.status).toBe('PRESTADO');
  });
});
