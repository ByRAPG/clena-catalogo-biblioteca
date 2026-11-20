import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { verify } from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { CreateInitialAdmin } from '../src/modules/iam/application/create-initial-admin.use-case';
import { Argon2PasswordHasher } from '../src/modules/iam/infrastructure/argon2-password-hasher';
import { PrismaUserRepository } from '../src/modules/iam/infrastructure/prisma-user.repository';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';

/**
 * e2e de T-42 (primer administrador) contra PostgreSQL real, en una base
 * temporal con las migraciones. Se omite sin E2E_DATABASE_URL.
 */
const baseUrl = process.env.E2E_DATABASE_URL;
const describeDb = baseUrl ? describe : describe.skip;

describeDb('Crear el primer administrador (e2e, T-42)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminClient: PrismaClient;
  let useCase: CreateInitialAdmin;
  let originalDatabaseUrl: string | undefined;
  const databaseName = `clena_admin_test_${randomUUID().replaceAll('-', '')}`;
  // Contraseña aleatoria de la prueba; no se escribe en ningún archivo.
  const password = randomBytes(18).toString('hex');
  const input = {
    email: 'Primer.Admin@example.org',
    password,
    fullName: 'Administrador ficticio',
  };

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    adminClient = new PrismaClient({ datasourceUrl: baseUrl });
    await adminClient.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
    const url = new URL(baseUrl as string);
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
    prisma = app.get(PrismaService);
    useCase = new CreateInitialAdmin(
      new PrismaUserRepository(prisma),
      new Argon2PasswordHasher(),
    );
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

  it('crea el administrador, el hash verifica y puede iniciar sesión', async () => {
    const result = await useCase.execute(input);
    expect(result.status).toBe('created');

    const row = await prisma.user.findUniqueOrThrow({
      where: { email: 'primer.admin@example.org' },
    });
    expect(row.role).toBe('ADMIN');
    expect(row.active).toBe(true);
    expect(row.passwordHash).not.toContain(password);
    expect(await verify(row.passwordHash, password)).toBe(true);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'primer.admin@example.org', password })
      .expect(200);
    expect(login.body.usuario.rol).toBe('ADMIN');
  });

  it('una segunda ejecución no cambia nada', async () => {
    const before = await prisma.user.findUniqueOrThrow({
      where: { email: 'primer.admin@example.org' },
    });

    const again = await useCase.execute({
      ...input,
      password: randomBytes(18).toString('hex'),
    });

    expect(again.status).toBe('already-exists');
    const after = await prisma.user.findUniqueOrThrow({
      where: { email: 'primer.admin@example.org' },
    });
    expect(after.passwordHash).toBe(before.passwordHash);
    expect(after.role).toBe('ADMIN');
    expect(await prisma.user.count()).toBe(1);
  });

  it('se niega a crear otro administrador salvo permiso explícito', async () => {
    const other = {
      email: 'segundo@example.org',
      password: randomBytes(18).toString('hex'),
      fullName: 'Segundo ficticio',
    };
    expect((await useCase.execute(other)).status).toBe('admin-present');
    expect(await prisma.user.count()).toBe(1);

    expect(
      (await useCase.execute({ ...other, allowAdditional: true })).status,
    ).toBe('created');
    expect(await prisma.user.count()).toBe(2);
  });
});
