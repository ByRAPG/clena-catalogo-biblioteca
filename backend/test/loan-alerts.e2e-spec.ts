import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CopyStatus, PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ACCESS_TOKEN_VERIFIER } from '../src/modules/iam/application/ports/access-token-verifier';
import { EMAIL_SENDER } from '../src/modules/loans/application/ports/email-sender.port';
import type { EmailMessage } from '../src/modules/loans/domain/alerts/alert-messages';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';

/**
 * e2e de HU-21 (alertas de devolución y disponibilidad) contra PostgreSQL real
 * en una base temporal. El correo se captura en memoria en vez de enviarse.
 */
describe('Alertas de devolución y disponibilidad (e2e, HU-21)', () => {
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
  const sent: EmailMessage[] = [];
  const fakeEmail = {
    send: async (message: EmailMessage) => {
      sent.push(message);
    },
  };

  let app: INestApplication;
  let database: PrismaService;
  let adminClient: PrismaClient;
  let originalDatabaseUrl: string | undefined;
  const databaseName = `clena_alerts_test_${randomUUID().replaceAll('-', '')}`;
  const http = () => request(app.getHttpServer());

  let readerWithEmail: string;
  let readerWithoutEmail: string;
  let waitedWorkId: string;
  let availableWorkId: string;
  let waitedLoanId: string;

  const day = 86_400_000;
  const hour = 3_600_000;

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
      .overrideProvider(EMAIL_SENDER)
      .useValue(fakeEmail)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    database = app.get(PrismaService);

    readerWithEmail = (
      await database.reader.create({
        data: { fullName: 'Lectora Ficticia', email: 'lectora@example.org' },
      })
    ).id;
    readerWithoutEmail = (
      await database.reader.create({ data: { fullName: 'Lector Sin Correo' } })
    ).id;

    const room = await database.room.create({ data: { name: 'Sala General' } });
    const section = await database.section.create({
      data: { roomId: room.id, name: 'Narrativa' },
    });
    const shelf = await database.shelf.create({
      data: { sectionId: section.id, code: 'A-01' },
    });

    const work = (title: string) =>
      database.work.create({
        data: { title, searchText: title.toLowerCase() },
      });
    const copy = (workId: string, code: string, status: CopyStatus) =>
      database.copy.create({
        data: { workId, shelfId: shelf.id, inventoryCode: code, status },
      });
    const loan = async (copyId: string, readerId: string, dueInMs: number) =>
      (
        await database.loan.create({
          data: { copyId, readerId, dueAt: new Date(Date.now() + dueInMs) },
        })
      ).id;

    const remindersWork = await work('Obra de recordatorios');
    await loan(
      (await copy(remindersWork.id, 'E2E-AL-1', CopyStatus.PRESTADO)).id,
      readerWithEmail,
      -2 * day,
    );
    await loan(
      (await copy(remindersWork.id, 'E2E-AL-2', CopyStatus.PRESTADO)).id,
      readerWithEmail,
      5 * hour,
    );
    await loan(
      (await copy(remindersWork.id, 'E2E-AL-3', CopyStatus.PRESTADO)).id,
      readerWithEmail,
      10 * day,
    );
    await loan(
      (await copy(remindersWork.id, 'E2E-AL-4', CopyStatus.PRESTADO)).id,
      readerWithoutEmail,
      3 * hour,
    );

    // Libro con su único ejemplar prestado: alguien espera que vuelva.
    const waited = await work('Obra esperada');
    waitedWorkId = waited.id;
    waitedLoanId = await loan(
      (await copy(waited.id, 'E2E-AL-5', CopyStatus.PRESTADO)).id,
      readerWithoutEmail,
      7 * day,
    );

    const available = await work('Obra disponible');
    availableWorkId = available.id;
    await copy(available.id, 'E2E-AL-6', CopyStatus.DISPONIBLE);
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

  const run = () =>
    http().post('/api/v1/loans/alerts/run').set('Authorization', STAFF);

  it('responde 401 sin sesión y 403 a un lector', async () => {
    await http().get('/api/v1/loans/alerts').expect(401);
    await http()
      .get('/api/v1/loans/alerts')
      .set('Authorization', READER)
      .expect(403);
    await http()
      .post('/api/v1/loans/alerts/run')
      .set('Authorization', READER)
      .expect(403);
  });

  it('la revisión envía un recordatorio por préstamo vencido o por vencer', async () => {
    const res = await run().expect(200);
    expect(res.body.reminders).toEqual({
      sent: 2,
      failed: 0,
      withoutEmail: 1,
      alreadySent: 0,
    });
    expect(sent.map((m) => m.subject).sort()).toEqual([
      'Préstamo vencido: Obra de recordatorios',
      'Su préstamo vence pronto: Obra de recordatorios',
    ]);
    expect(sent.every((m) => m.to === 'lectora@example.org')).toBe(true);
  });

  it('si la revisión corre otra vez el mismo día no repite avisos', async () => {
    const res = await run().expect(200);
    expect(res.body.reminders).toMatchObject({ sent: 0, alreadySent: 3 });
    expect(sent).toHaveLength(2);
    expect(await database.notification.count()).toBe(3);
  });

  it('el panel muestra primero el vencido y marca «Por vencer»', async () => {
    const res = await http()
      .get('/api/v1/loans/alerts')
      .set('Authorization', STAFF)
      .expect(200);
    const loans = res.body.loans as {
      type: string;
      inventoryCode: string;
      notifiedAt: string | null;
      notifyError: string | null;
    }[];
    expect(loans.map((l) => [l.inventoryCode, l.type])).toEqual([
      ['E2E-AL-1', 'VENCIDO'],
      ['E2E-AL-4', 'POR_VENCER'],
      ['E2E-AL-2', 'POR_VENCER'],
    ]);
    expect(loans[0].notifiedAt).not.toBeNull();
    expect(loans[1].notifyError).toBe('El lector no tiene correo registrado');
  });

  it('valida la solicitud «Avísame cuando esté disponible»', async () => {
    const pedir = (readerId: string, workId: string) =>
      http()
        .post('/api/v1/loans/availability-alerts')
        .set('Authorization', STAFF)
        .send({ readerId, workId });

    await pedir(readerWithoutEmail, waitedWorkId).expect(400);
    await pedir(readerWithEmail, availableWorkId).expect(409);
    await pedir(readerWithEmail, randomUUID()).expect(404);
    await pedir(randomUUID(), waitedWorkId).expect(404);
    await pedir(readerWithEmail, waitedWorkId).expect(201);
    await pedir(readerWithEmail, waitedWorkId).expect(409);
  });

  it('al devolver el ejemplar, quien lo pidió recibe un correo una sola vez', async () => {
    await http()
      .post(`/api/v1/loans/${waitedLoanId}/return`)
      .set('Authorization', STAFF)
      .expect(200);

    // El aviso sale en segundo plano para no retrasar la devolución.
    const esperado = 'Ya está disponible: Obra esperada';
    for (let i = 0; i < 50 && !sent.some((m) => m.subject === esperado); i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(sent.filter((m) => m.subject === esperado)).toHaveLength(1);

    await run().expect(200);
    expect(sent.filter((m) => m.subject === esperado)).toHaveLength(1);
    const panel = await http()
      .get('/api/v1/loans/alerts')
      .set('Authorization', STAFF)
      .expect(200);
    expect(panel.body.availability).toEqual([]);
  });
});
