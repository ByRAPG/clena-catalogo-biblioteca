import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, Role } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { ACCESS_TOKEN_VERIFIER } from '../src/modules/iam/application/ports/access-token-verifier';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';

/** e2e de HU-18 (cuentas del personal) contra PostgreSQL real. */
describe('Cuentas del personal (e2e, HU-18)', () => {
  const adminId = randomUUID();
  const staffId = randomUUID();
  const readerUserId = randomUUID();
  const verifier = {
    verifyAccessToken: async (token: string) => {
      if (token === 'test-admin')
        return { userId: adminId, role: 'ADMIN' as const };
      if (token === 'test-staff')
        return { userId: staffId, role: 'STAFF' as const };
      if (token === 'test-reader')
        return { userId: readerUserId, role: 'READER' as const };
      return null;
    },
  };
  const ADMIN = 'Bearer test-admin';
  const STAFF = 'Bearer test-staff';
  const READER = 'Bearer test-reader';

  let app: INestApplication;
  let database: PrismaService;
  let adminClient: PrismaClient;
  let originalDatabaseUrl: string | undefined;
  const databaseName = `clena_users_test_${randomUUID().replaceAll('-', '')}`;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    if (!originalDatabaseUrl) throw new Error('DATABASE_URL es necesaria');
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
      .useValue(verifier)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    database = app.get(PrismaService);
    await database.user.createMany({
      data: [
        {
          id: adminId,
          email: 'admin@example.org',
          passwordHash: 'x',
          fullName: 'Admin',
          role: Role.ADMIN,
        },
        {
          id: staffId,
          email: 'staff@example.org',
          passwordHash: 'x',
          fullName: 'Staff',
          role: Role.STAFF,
        },
        {
          id: readerUserId,
          email: 'lector@example.org',
          passwordHash: 'x',
          fullName: 'Lector',
          role: Role.READER,
        },
      ],
    });
  }, 60000);

  afterAll(async () => {
    await app?.close();
    if (originalDatabaseUrl) process.env.DATABASE_URL = originalDatabaseUrl;
    await adminClient?.$executeRawUnsafe(
      `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`,
    );
    await adminClient?.$disconnect();
  });

  it('STAFF y READER reciben 403; sin sesión, 401', async () => {
    await http().get('/api/v1/users').expect(401);
    await http().get('/api/v1/users').set('Authorization', STAFF).expect(403);
    await http().get('/api/v1/users').set('Authorization', READER).expect(403);
    await http()
      .post('/api/v1/users')
      .set('Authorization', STAFF)
      .send({
        fullName: 'X',
        email: 'x@example.org',
        password: 'una-clave-larga-1',
      })
      .expect(403);
  });

  it('lista personal y administradores, sin lectores', async () => {
    const res = await http()
      .get('/api/v1/users')
      .set('Authorization', ADMIN)
      .expect(200);
    const emails = res.body.data.map((u: { email: string }) => u.email);
    expect(emails).toEqual(
      expect.arrayContaining(['admin@example.org', 'staff@example.org']),
    );
    expect(emails).not.toContain('lector@example.org');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('crea personal STAFF, rechaza duplicados y contraseñas débiles', async () => {
    const body = {
      fullName: 'Nueva Persona',
      email: 'nueva@example.org',
      password: 'una-clave-larga-1',
    };
    const created = await http()
      .post('/api/v1/users')
      .set('Authorization', ADMIN)
      .send(body)
      .expect(201);
    const row = await database.user.findUniqueOrThrow({
      where: { id: created.body.id },
    });
    expect(row.role).toBe('STAFF');
    expect(row.passwordHash).not.toContain('una-clave');
    await http()
      .post('/api/v1/users')
      .set('Authorization', ADMIN)
      .send(body)
      .expect(409);
    await http()
      .post('/api/v1/users')
      .set('Authorization', ADMIN)
      .send({ ...body, email: 'otra@example.org', password: 'corta' })
      .expect(400);
  });

  it('desactivar revoca sus sesiones; un admin no se desactiva a sí mismo', async () => {
    await database.refreshToken.create({
      data: {
        userId: staffId,
        tokenHash: randomUUID(),
        familyId: randomUUID(),
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });
    await http()
      .patch(`/api/v1/users/${staffId}`)
      .set('Authorization', ADMIN)
      .send({ active: false })
      .expect(204);
    expect(
      (await database.user.findUniqueOrThrow({ where: { id: staffId } }))
        .active,
    ).toBe(false);
    expect(
      await database.refreshToken.count({
        where: { userId: staffId, revokedAt: null },
      }),
    ).toBe(0);
    await http()
      .patch(`/api/v1/users/${staffId}`)
      .set('Authorization', ADMIN)
      .send({ active: true })
      .expect(204);
    await http()
      .patch(`/api/v1/users/${adminId}`)
      .set('Authorization', ADMIN)
      .send({ active: false })
      .expect(409);
    await http()
      .patch(`/api/v1/users/${readerUserId}`)
      .set('Authorization', ADMIN)
      .send({ active: false })
      .expect(404);
    await http()
      .patch('/api/v1/users/no-es-uuid')
      .set('Authorization', ADMIN)
      .send({ active: false })
      .expect(400);
  });
});
