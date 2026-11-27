import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { Argon2PasswordHasher } from '../src/modules/iam/infrastructure/argon2-password-hasher';
import { PrismaService } from '../src/shared/infrastructure/prisma.service';

/**
 * e2e de la autenticación (T-28) con el JWT real y PostgreSQL real, en una base
 * temporal con las migraciones. Se omite sin E2E_DATABASE_URL.
 */
const baseUrl = process.env.E2E_DATABASE_URL;
const describeDb = baseUrl ? describe : describe.skip;

const GENERIC_MESSAGE = 'Correo o contraseña incorrectos';

describeDb('Autenticación con JWT real (e2e, T-28)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminClient: PrismaClient;
  let originalDatabaseUrl: string | undefined;
  let originalAuthLimit: string | undefined;
  const databaseName = `clena_auth_test_${randomUUID().replaceAll('-', '')}`;
  const hasher = new Argon2PasswordHasher();
  // Contraseña aleatoria de la prueba; no se escribe en ningún archivo.
  const password = randomBytes(18).toString('hex');
  let passwordHash: string;

  const uniqueEmail = (tag: string) =>
    `${tag}.${randomUUID().slice(0, 8)}@example.org`;

  async function createUser(
    tag: string,
    role: 'ADMIN' | 'STAFF' | 'READER' = 'STAFF',
  ) {
    const email = uniqueEmail(tag);
    await prisma.user.create({
      data: { email, passwordHash, fullName: `Usuario ${tag}`, role },
    });
    return email;
  }

  const login = (email: string, pass = password) =>
    request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: pass });

  function refreshCookie(res: request.Response): string {
    const raw = res.headers['set-cookie'] as unknown as string[] | undefined;
    const line = (raw ?? []).find((c) => c.startsWith('refresh_token='));
    if (!line) throw new Error('No llegó la cookie refresh_token');
    return line;
  }

  /** Valor `refresh_token=...` listo para reenviar en la cabecera Cookie. */
  const cookieValue = (line: string) => line.split(';')[0];

  const refresh = (cookie: string) =>
    request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie);

  beforeAll(async () => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    originalAuthLimit = process.env.THROTTLE_AUTH_LIMIT;
    // El límite por IP de /auth (20/min) no es lo que se prueba aquí.
    process.env.THROTTLE_AUTH_LIMIT = '100000';
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
    passwordHash = await hasher.hash(password);
  }, 90000);

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
    if (originalAuthLimit === undefined) delete process.env.THROTTLE_AUTH_LIMIT;
    else process.env.THROTTLE_AUTH_LIMIT = originalAuthLimit;
  });

  it('login correcto: 200, accessToken y cookie refresh_token segura', async () => {
    const email = await createUser('login-ok');

    const res = await login(email).expect(200);

    expect(typeof res.body.accessToken).toBe('string');
    expect(res.body.accessToken.split('.')).toHaveLength(3);
    expect(res.body.usuario.rol).toBe('STAFF');
    const cookie = refreshCookie(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth(;|$)/);
  });

  it('login incorrecto: mismo 401 genérico con correo inexistente y contraseña mala', async () => {
    const email = await createUser('login-bad');

    const wrongPass = await login(email, `${password}x`).expect(401);
    const unknown = await login(uniqueEmail('nadie')).expect(401);

    expect(wrongPass.body.message).toBe(GENERIC_MESSAGE);
    expect(unknown.body.message).toBe(GENERIC_MESSAGE);
    expect(wrongPass.headers['set-cookie']).toBeUndefined();
  });

  it('bloquea la cuenta tras 5 intentos fallidos, aun con la contraseña correcta', async () => {
    const email = await createUser('lock');

    for (let i = 0; i < 5; i++) {
      await login(email, `${password}mala${i}`).expect(401);
    }
    const res = await login(email).expect(401);

    expect(res.body.message).toBe(GENERIC_MESSAGE);
    expect(res.headers['set-cookie']).toBeUndefined();
    const row = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(row.lockedUntil).not.toBeNull();
    expect(row.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it('renueva la sesión: nuevo accessToken y cookie rotada', async () => {
    const email = await createUser('refresh');
    const first = refreshCookie(await login(email).expect(200));

    const res = await refresh(cookieValue(first)).expect(200);

    expect(typeof res.body.accessToken).toBe('string');
    const second = refreshCookie(res);
    expect(cookieValue(second)).not.toBe(cookieValue(first));
    expect(second).toMatch(/HttpOnly/i);
    expect(second).toMatch(/SameSite=Strict/i);
  });

  it('reutilizar una cookie ya rotada da 401 y revoca la familia', async () => {
    const email = await createUser('reuse');
    const first = refreshCookie(await login(email).expect(200));
    const rotated = refreshCookie(
      await refresh(cookieValue(first)).expect(200),
    );

    await refresh(cookieValue(first)).expect(401);

    // La cookie nueva de la misma familia ya no sirve.
    await refresh(cookieValue(rotated)).expect(401);
  });

  it('logout: después, el refresh con esa cookie da 401', async () => {
    const email = await createUser('logout');
    const cookie = cookieValue(refreshCookie(await login(email).expect(200)));

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie)
      .expect(204);

    await refresh(cookie).expect(401);
  });

  describe('roles con JWT real', () => {
    const shelves = '/api/v1/catalog/shelves';

    async function tokenFor(tag: string, role: 'STAFF' | 'READER') {
      const email = await createUser(tag, role);
      const res = await login(email).expect(200);
      return res.body.accessToken as string;
    }

    it('STAFF accede a una ruta de gestión (200)', async () => {
      const token = await tokenFor('staff', 'STAFF');
      await request(app.getHttpServer())
        .get(shelves)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('READER recibe 403', async () => {
      const token = await tokenFor('reader', 'READER');
      await request(app.getHttpServer())
        .get(shelves)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('sin token recibe 401', async () => {
      await request(app.getHttpServer()).get(shelves).expect(401);
    });

    it('con un token falso recibe 401', async () => {
      await request(app.getHttpServer())
        .get(shelves)
        .set('Authorization', 'Bearer no.es.valido')
        .expect(401);
    });
  });
});
