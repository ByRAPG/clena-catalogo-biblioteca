import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../src/app.setup';
import { CatalogModule } from '../src/modules/catalog/catalog.module';
import { ACCESS_TOKEN_VERIFIER } from '../src/modules/iam/application/ports/access-token-verifier';
import { SearchModule } from '../src/modules/search/search.module';
import { SharedModule } from '../src/shared/shared.module';

/**
 * e2e del QR (HU-05) contra PostgreSQL real con la semilla aplicada.
 * Se omite si no hay E2E_DATABASE_URL.
 */
const databaseUrl = process.env.E2E_DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;
// Generar el PNG dentro de Jest es lento en algunos equipos.
jest.setTimeout(60000);

const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');

// Verificador falso: el QR por sala exige sesión de STAFF o ADMIN (HU-09).
const fakeVerifier = {
  verifyAccessToken: async (token: string) => {
    if (token === 'test-staff') return { userId: 'u1', role: 'STAFF' as const };
    if (token === 'test-reader')
      return { userId: 'u2', role: 'READER' as const };
    return null;
  },
};
const STAFF = 'Bearer test-staff';

const binary = (
  res: request.Response,
  cb: (err: Error | null, body: Buffer) => void,
) => {
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
};

describeDb('QR de acceso (e2e, PostgreSQL real)', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        SharedModule,
        SearchModule,
        CatalogModule,
      ],
    })
      .overrideProvider(ACCESS_TOKEN_VERIFIER)
      .useValue(fakeVerifier)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /rooms/qr devuelve el PNG de entrada', async () => {
    const res = await http()
      .get('/api/v1/rooms/qr')
      .buffer(true)
      .parse(binary)
      .expect(200);
    expect(res.headers['content-type']).toContain('image/png');
    expect(res.headers['content-disposition']).toBe(
      'attachment; filename="qr-entrada.png"',
    );
    expect((res.body as Buffer).subarray(0, 8).equals(PNG_SIGNATURE)).toBe(
      true,
    );
  });

  it('GET /rooms/:id/qr devuelve el PNG de una sala existente', async () => {
    const rooms = await http().get('/api/v1/search/rooms').expect(200);
    const room = rooms.body.data[0] as { id: string; name: string };
    const res = await http()
      .get(`/api/v1/rooms/${room.id}/qr`)
      .set('Authorization', STAFF)
      .buffer(true)
      .parse(binary)
      .expect(200);
    expect(res.headers['content-type']).toContain('image/png');
    expect(res.headers['content-disposition']).toMatch(
      /^attachment; filename="qr-sala-[a-z0-9-]+\.png"$/,
    );
    expect((res.body as Buffer).subarray(0, 8).equals(PNG_SIGNATURE)).toBe(
      true,
    );
  });

  it('una sala inexistente responde 404 y un id inválido 400', async () => {
    await http()
      .get('/api/v1/rooms/00000000-0000-4000-8000-000000000000/qr')
      .set('Authorization', STAFF)
      .expect(404);
    await http()
      .get('/api/v1/rooms/no-uuid/qr')
      .set('Authorization', STAFF)
      .expect(400);
  });

  it('el QR de una sala exige sesión: sin token 401 y como lector 403', async () => {
    const id = '00000000-0000-4000-8000-000000000000';
    await http().get(`/api/v1/rooms/${id}/qr`).expect(401);
    await http()
      .get(`/api/v1/rooms/${id}/qr`)
      .set('Authorization', 'Bearer test-reader')
      .expect(403);
  });
});
