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

/** e2e de HU-14 (reservas) contra PostgreSQL real, con su efecto en los préstamos. */
describe('Reservas (e2e, HU-14)', () => {
  const ids = {
    ana: randomUUID(),
    beto: randomUUID(),
    staff: randomUUID(),
    carla: randomUUID(),
    inactiva: randomUUID(),
    anonima: randomUUID(),
  };
  const verifier = {
    verifyAccessToken: async (token: string) => {
      if (token === 'ana') return { userId: ids.ana, role: 'READER' as const };
      if (token === 'beto')
        return { userId: ids.beto, role: 'READER' as const };
      if (token === 'carla')
        return { userId: ids.carla, role: 'READER' as const };
      if (token === 'inactiva')
        return { userId: ids.inactiva, role: 'READER' as const };
      if (token === 'anonima')
        return { userId: ids.anonima, role: 'READER' as const };
      if (token === 'staff')
        return { userId: ids.staff, role: 'STAFF' as const };
      return null;
    },
  };
  const ANA = 'Bearer ana';
  const BETO = 'Bearer beto';
  const STAFF = 'Bearer staff';

  let app: INestApplication;
  let database: PrismaService;
  let adminClient: PrismaClient;
  let originalDatabaseUrl: string | undefined;
  let workId: string;
  let soloWorkId: string;
  let shelfId: string;
  const databaseName = `clena_resv_test_${randomUUID().replaceAll('-', '')}`;
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
          id: ids.ana,
          email: 'ana@example.org',
          passwordHash: 'x',
          fullName: 'Ana',
          role: 'READER',
        },
        {
          id: ids.beto,
          email: 'beto@example.org',
          passwordHash: 'x',
          fullName: 'Beto',
          role: 'READER',
        },
        {
          id: ids.staff,
          email: 'staff@example.org',
          passwordHash: 'x',
          fullName: 'Staff',
          role: 'STAFF',
        },
      ],
    });
    const room = await database.room.create({ data: { name: 'Sala' } });
    const section = await database.section.create({
      data: { roomId: room.id, name: 'Sec' },
    });
    shelfId = (
      await database.shelf.create({
        data: { sectionId: section.id, code: 'E-1' },
      })
    ).id;
    workId = (
      await database.work.create({
        data: { title: 'Obra con dos copias', searchText: 'obra' },
      })
    ).id;
    soloWorkId = (
      await database.work.create({
        data: { title: 'Obra con una copia', searchText: 'solo' },
      })
    ).id;
    for (const [work, code] of [
      [workId, 'RSV-001'],
      [workId, 'RSV-002'],
      [soloWorkId, 'RSV-003'],
    ] as const) {
      await database.copy.create({
        data: {
          workId: work,
          shelfId,
          inventoryCode: code,
          status: 'DISPONIBLE',
        },
      });
    }
  }, 60000);

  afterAll(async () => {
    await app?.close();
    if (originalDatabaseUrl) process.env.DATABASE_URL = originalDatabaseUrl;
    await adminClient?.$executeRawUnsafe(
      `DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`,
    );
    await adminClient?.$disconnect();
  });

  it('solo los lectores con sesión reservan', async () => {
    await http().post('/api/v1/reservations').send({ workId }).expect(401);
    await http()
      .post('/api/v1/reservations')
      .set('Authorization', STAFF)
      .send({ workId })
      .expect(403);
    await http()
      .post('/api/v1/reservations')
      .set('Authorization', ANA)
      .send({ workId: 'no-uuid' })
      .expect(400);
    await http()
      .post('/api/v1/reservations')
      .set('Authorization', ANA)
      .send({ workId: randomUUID() })
      .expect(404);
  });

  it('reserva un ejemplar con plazo, sin cambiar su estado, y no repite la obra', async () => {
    const res = await http()
      .post('/api/v1/reservations')
      .set('Authorization', ANA)
      .send({ workId })
      .expect(201);
    const horas =
      (new Date(res.body.expiresAt).getTime() -
        new Date(res.body.reservedAt).getTime()) /
      3_600_000;
    expect(Math.round(horas)).toBe(48);
    const copy = await database.copy.findFirstOrThrow({
      where: { inventoryCode: res.body.inventoryCode },
    });
    expect(copy.status).toBe('DISPONIBLE');

    await http()
      .post('/api/v1/reservations')
      .set('Authorization', ANA)
      .send({ workId })
      .expect(409);
    // Otro lector toma el otro ejemplar, y luego ya no queda ninguno.
    const beto = await http()
      .post('/api/v1/reservations')
      .set('Authorization', BETO)
      .send({ workId })
      .expect(201);
    expect(beto.body.inventoryCode).not.toBe(res.body.inventoryCode);
    const mine = await http()
      .get('/api/v1/reservations/mine')
      .set('Authorization', ANA)
      .expect(200);
    expect(mine.body.data).toHaveLength(1);
  });

  it('el personal no presta un ejemplar reservado a otro lector; al que reservó sí y la reserva se cumple', async () => {
    const reservation = await database.reservation.findFirstOrThrow({
      where: { reader: { userId: ids.ana }, status: 'ACTIVA' },
    });
    const anaReader = await database.reader.findFirstOrThrow({
      where: { userId: ids.ana },
    });
    const betoReader = await database.reader.findFirstOrThrow({
      where: { userId: ids.beto },
    });

    const blocked = await http()
      .post('/api/v1/loans')
      .set('Authorization', STAFF)
      .send({ copyId: reservation.copyId, readerId: betoReader.id })
      .expect(409);
    expect(blocked.body.message).toMatch(/reserva activa/);

    await http()
      .post('/api/v1/loans')
      .set('Authorization', STAFF)
      .send({ copyId: reservation.copyId, readerId: anaReader.id })
      .expect(201);
    const after = await database.reservation.findUniqueOrThrow({
      where: { id: reservation.id },
    });
    expect(after.status).toBe('RECOGIDA');
    expect(after.resolvedAt).not.toBeNull();
  });

  it('cancelar: solo la propia; libera el ejemplar para otra persona', async () => {
    const mine = await database.reservation.findFirstOrThrow({
      where: { reader: { userId: ids.beto }, status: 'ACTIVA' },
    });
    await http()
      .delete(`/api/v1/reservations/${mine.id}`)
      .set('Authorization', ANA)
      .expect(404);
    await http()
      .delete(`/api/v1/reservations/${mine.id}`)
      .set('Authorization', BETO)
      .expect(204);
    await http()
      .delete(`/api/v1/reservations/${mine.id}`)
      .set('Authorization', BETO)
      .expect(404);
    // Con el ejemplar libre, Ana (otra persona) puede reservar esta obra otra vez: su primera ya se cumplió.
    await http()
      .post('/api/v1/reservations')
      .set('Authorization', ANA)
      .send({ workId })
      .expect(201);
  });

  it('una reserva vencida se marca VENCIDA al listar y libera el ejemplar', async () => {
    await http()
      .post('/api/v1/reservations')
      .set('Authorization', BETO)
      .send({ workId: soloWorkId })
      .expect(201);
    await http()
      .post('/api/v1/reservations')
      .set('Authorization', ANA)
      .send({ workId: soloWorkId })
      .expect(409);
    await database.reservation.updateMany({
      where: { reader: { userId: ids.beto }, status: 'ACTIVA' },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const list = await http()
      .get('/api/v1/reservations/mine')
      .set('Authorization', BETO)
      .expect(200);
    expect(list.body.data).toHaveLength(0);
    expect(
      await database.reservation.count({ where: { status: 'VENCIDA' } }),
    ).toBe(1);
    await http()
      .post('/api/v1/reservations')
      .set('Authorization', ANA)
      .send({ workId: soloWorkId })
      .expect(201);
  });

  it('el índice único parcial impide dos reservas activas del mismo ejemplar', async () => {
    const active = await database.reservation.findFirstOrThrow({
      where: { status: 'ACTIVA' },
    });
    const other = await database.reader.findFirstOrThrow({
      where: { id: { not: active.readerId } },
    });
    await expect(
      database.reservation.create({
        data: {
          workId: active.workId,
          copyId: active.copyId,
          readerId: other.id,
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('reservas simultáneas de la misma obra: solo una por lector y una por ejemplar', async () => {
    const work = await database.work.create({
      data: { title: 'Carrera', searchText: 'carrera' },
    });
    await database.copy.create({
      data: {
        workId: work.id,
        shelfId,
        inventoryCode: 'RSV-900',
        status: 'DISPONIBLE',
      },
    });
    const results = await Promise.all([
      http()
        .post('/api/v1/reservations')
        .set('Authorization', ANA)
        .send({ workId: work.id }),
      http()
        .post('/api/v1/reservations')
        .set('Authorization', ANA)
        .send({ workId: work.id }),
      http()
        .post('/api/v1/reservations')
        .set('Authorization', BETO)
        .send({ workId: work.id }),
    ]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409, 409]);
    expect(
      await database.reservation.count({
        where: { workId: work.id, status: 'ACTIVA' },
      }),
    ).toBe(1);
  });

  it('una cuenta inactiva o anonimizada con token vigente recibe 401 y no obtiene lector', async () => {
    await database.user.createMany({
      data: [
        {
          id: ids.inactiva,
          email: 'inactiva@example.org',
          passwordHash: 'x',
          fullName: 'Inactiva',
          role: 'READER',
          active: false,
        },
        {
          id: ids.anonima,
          email: 'anonima@anonimo.invalid',
          passwordHash: '!anonimizada',
          fullName: 'Cuenta eliminada',
          role: 'READER',
          active: false,
          anonymizedAt: new Date(),
        },
      ],
    });
    for (const token of ['inactiva', 'anonima']) {
      const auth = `Bearer ${token}`;
      await http()
        .post('/api/v1/reservations')
        .set('Authorization', auth)
        .send({ workId })
        .expect(401);
      await http()
        .get('/api/v1/reservations/mine')
        .set('Authorization', auth)
        .expect(401);
      await http()
        .delete(`/api/v1/reservations/${randomUUID()}`)
        .set('Authorization', auth)
        .expect(401);
    }
    expect(
      await database.reader.count({
        where: { userId: { in: [ids.inactiva, ids.anonima] } },
      }),
    ).toBe(0);
  });

  it('un lector no puede tener más de 3 reservas activas; cancelar una libera el cupo', async () => {
    await database.user.create({
      data: {
        id: ids.carla,
        email: 'carla@example.org',
        passwordHash: 'x',
        fullName: 'Carla',
        role: 'READER',
      },
    });
    const CARLA = 'Bearer carla';
    const obras: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      const work = await database.work.create({
        data: { title: `Tope ${i}`, searchText: `tope${i}` },
      });
      await database.copy.create({
        data: {
          workId: work.id,
          shelfId,
          inventoryCode: `RSV-TOPE-${i}`,
          status: 'DISPONIBLE',
        },
      });
      obras.push(work.id);
    }
    const reservas: string[] = [];
    for (const id of obras.slice(0, 3)) {
      const res = await http()
        .post('/api/v1/reservations')
        .set('Authorization', CARLA)
        .send({ workId: id })
        .expect(201);
      reservas.push(res.body.id);
    }
    const rechazo = await http()
      .post('/api/v1/reservations')
      .set('Authorization', CARLA)
      .send({ workId: obras[3] })
      .expect(409);
    expect(rechazo.body.message).toBe(
      'Tiene el máximo de 3 reservas activas; cancele una para reservar otra',
    );
    await http()
      .delete(`/api/v1/reservations/${reservas[0]}`)
      .set('Authorization', CARLA)
      .expect(204);
    await http()
      .post('/api/v1/reservations')
      .set('Authorization', CARLA)
      .send({ workId: obras[3] })
      .expect(201);
  });

  it('al prestar un ejemplar se cierran todas las reservas activas del lector para esa obra', async () => {
    const work = await database.work.create({
      data: { title: 'Dos copias, una reserva', searchText: 'dos copias' },
    });
    const [copyA, copyB] = await Promise.all(
      ['RSV-PA', 'RSV-PB'].map((inventoryCode) =>
        database.copy.create({
          data: {
            workId: work.id,
            shelfId,
            inventoryCode,
            status: 'DISPONIBLE',
          },
        }),
      ),
    );
    const reader = await database.reader.create({
      data: { fullName: 'Lector de mostrador' },
    });
    const reserva = await database.reservation.create({
      data: {
        workId: work.id,
        copyId: copyA.id,
        readerId: reader.id,
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });
    // Se presta el OTRO ejemplar de la obra: la reserva del lector se cumple.
    await http()
      .post('/api/v1/loans')
      .set('Authorization', STAFF)
      .send({ copyId: copyB.id, readerId: reader.id })
      .expect(201);
    const after = await database.reservation.findUniqueOrThrow({
      where: { id: reserva.id },
    });
    expect(after.status).toBe('RECOGIDA');
    expect(after.resolvedAt).not.toBeNull();
  });
});
