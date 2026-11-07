import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../src/app.setup';
import { HEALTH_REPOSITORY } from '../src/shared/application/ports/health.repository';
import { GetHealth } from '../src/shared/application/get-health.use-case';
import { HealthController } from '../src/shared/presentation/health.controller';

describe('GET /api/v1/health (e2e)', () => {
  let app: INestApplication;
  const repository = { isDatabaseAvailable: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        GetHealth,
        { provide: HEALTH_REPOSITORY, useValue: repository },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde ok con la base disponible', async () => {
    repository.isDatabaseAvailable.mockResolvedValue(true);
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('responde degraded sin romper si la base falla', async () => {
    repository.isDatabaseAvailable.mockRejectedValue(new Error('down'));
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect(res.body).toMatchObject({ status: 'degraded', database: 'down' });
  });

  it('devuelve el formato de error uniforme en rutas inexistentes', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/nope')
      .expect(404);
    expect(Object.keys(res.body).sort()).toEqual(
      ['error', 'message', 'path', 'statusCode', 'timestamp'].sort(),
    );
    expect(res.body.path).toBe('/api/v1/nope');
  });

  it('sirve Swagger en /docs', async () => {
    await request(app.getHttpServer()).get('/docs-json').expect(200);
  });
});
