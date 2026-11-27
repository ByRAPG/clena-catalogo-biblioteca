import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';

/** e2e de HU-16 (registro de lector) y HU-17 (eliminar mi cuenta) con login real. */
describe('Cuenta de lector (e2e, HU-16 y HU-17)', () => {
  const PASSWORD = 'una-clave-larga-1';
  let app: INestApplication;
  let database: PrismaService;
  let adminClient: PrismaClient;
  let originalDatabaseUrl: string | undefined;
  const databaseName = `clena_reader_test_${randomUUID().replaceAll('-', '')}`;
  const http = () => request(app.getHttpServer());

  const register = (email: string, extra: Record<string, unknown> = {}) =>
    http()
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Carmen Pérez',
        email,
        password: PASSWORD,
        acceptPrivacy: true,
        ...extra,
      });

  const login = (email: string, password = PASSWORD) =>
    http().post('/api/v1/auth/login').send({ email, password });

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    if (!originalDatabaseUrl) throw new Error('DATABASE_URL es necesaria');
    adminClient = new PrismaClient({ datasourceUrl: originalDatabaseUrl });
    await adminClient.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
    const url = new URL(originalDatabaseUrl);
    url.pathname = `/${databaseName}`;
    process.env.DATABASE_URL = url.toString();
    process.env.THROTTLE_AUTH_LIMIT = '1000';
    execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
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
  }, 60000);

  afterAll(async () => {
    await app?.close();
    delete process.env.THROTTLE_AUTH_LIMIT;
    if (originalDatabaseUrl) process.env.DATABASE_URL = originalDatabaseUrl;
    await adminClient?.$executeRawUnsafe(
      `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`,
    );
    await adminClient?.$disconnect();
  });

  it('el registro exige aceptar el aviso y cumplir la política', async () => {
    await register('a@example.org', { acceptPrivacy: false }).expect(400);
    await register('a@example.org', { acceptPrivacy: undefined }).expect(400);
    await register('a@example.org', { password: 'corta' }).expect(400);
    expect(await database.user.count()).toBe(0);
  });

  it('crea User READER con consentimiento y Reader vinculado; permite ingresar', async () => {
    await register('Carmen@Example.org').expect(201, { registrado: true });
    const user = await database.user.findUniqueOrThrow({
      where: { email: 'carmen@example.org' },
      include: { reader: true },
    });
    expect(user.role).toBe('READER');
    expect(user.consentAt).not.toBeNull();
    expect(user.privacyVersion).toBe('2026-11-25');
    expect(user.reader?.userId).toBe(user.id);

    const session = await login('carmen@example.org').expect(200);
    expect(session.body.usuario.rol).toBe('READER');
    const me = await http()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${session.body.accessToken}`)
      .expect(200);
    expect(me.body.correo).toBe('carmen@example.org');
    expect(me.body.versionAviso).toBe('2026-11-25');
    expect(JSON.stringify(me.body)).not.toContain('hash');
    await http().get('/api/v1/auth/me').expect(401);
  });

  it('un correo repetido responde igual y no cambia la cuenta existente', async () => {
    const before = await database.user.findUniqueOrThrow({
      where: { email: 'carmen@example.org' },
    });
    await register('carmen@example.org', {
      password: 'otra-clave-larga-9',
    }).expect(201, { registrado: true });
    const after = await database.user.findUniqueOrThrow({
      where: { email: 'carmen@example.org' },
    });
    expect(after.passwordHash).toBe(before.passwordHash);
    expect(await database.user.count({ where: { role: 'READER' } })).toBe(1);
  });

  it('eliminar: contraseña incorrecta 403, préstamo activo 409, luego anonimiza', async () => {
    const user = await database.user.findUniqueOrThrow({
      where: { email: 'carmen@example.org' },
      include: { reader: true },
    });
    const session = await login('carmen@example.org').expect(200);
    const auth = `Bearer ${session.body.accessToken}`;

    await http()
      .post('/api/v1/auth/me/delete')
      .set('Authorization', auth)
      .send({ password: 'incorrecta-incorrecta' })
      .expect(403);

    const room = await database.room.create({ data: { name: 'Sala' } });
    const section = await database.section.create({
      data: { roomId: room.id, name: 'Sec' },
    });
    const shelf = await database.shelf.create({
      data: { sectionId: section.id, code: 'E-9' },
    });
    const work = await database.work.create({
      data: { title: 'Libro', searchText: 'libro' },
    });
    const copy = await database.copy.create({
      data: {
        workId: work.id,
        shelfId: shelf.id,
        inventoryCode: 'ACC-001',
        status: 'PRESTADO',
      },
    });
    const loan = await database.loan.create({
      data: {
        copyId: copy.id,
        readerId: user.reader!.id,
        dueAt: new Date(Date.now() + 86_400_000),
      },
    });
    const blocked = await http()
      .post('/api/v1/auth/me/delete')
      .set('Authorization', auth)
      .send({ password: PASSWORD })
      .expect(409);
    expect(blocked.body.message).toMatch(/Devuelva el libro/);
    expect(
      (await database.user.findUniqueOrThrow({ where: { id: user.id } }))
        .anonymizedAt,
    ).toBeNull();

    await database.loan.update({
      where: { id: loan.id },
      data: { returnedAt: new Date() },
    });
    await http()
      .post('/api/v1/auth/me/delete')
      .set('Authorization', auth)
      .send({ password: PASSWORD })
      .expect(204);

    const gone = await database.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { reader: true },
    });
    expect(gone.anonymizedAt).not.toBeNull();
    expect(gone.active).toBe(false);
    expect(gone.email).toMatch(/^eliminada-.+@anonimo\.invalid$/);
    expect(gone.fullName).not.toContain('Carmen');
    expect(gone.reader?.anonymizedAt).not.toBeNull();
    expect(gone.reader?.email).toBeNull();
    expect(
      await database.refreshToken.count({
        where: { userId: user.id, revokedAt: null },
      }),
    ).toBe(0);
    // El historial de préstamos se conserva.
    expect(await database.loan.count({ where: { id: loan.id } })).toBe(1);
    await login('carmen@example.org').expect(401);
    // El token de acceso anterior ya no abre la cuenta.
    await http().get('/api/v1/auth/me').set('Authorization', auth).expect(401);
  });
});
