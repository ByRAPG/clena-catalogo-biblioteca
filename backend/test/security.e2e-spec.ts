import { Controller, Get, INestApplication, Post } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { configureApp } from '../src/app.setup';
import { GetHealth } from '../src/shared/application/get-health.use-case';
import { HEALTH_REPOSITORY } from '../src/shared/application/ports/health.repository';
import { HealthController } from '../src/shared/presentation/health.controller';
import { AppThrottlerGuard } from '../src/shared/http/app-throttler.guard';
import { buildThrottlerOptions } from '../src/shared/config/throttler.config';

@Controller('ping')
class PingController {
  @Get()
  ping() {
    return { ok: true };
  }
}

@Controller('auth')
class FakeAuthController {
  @Post('login')
  login() {
    return { ok: true };
  }
}

describe('Cabeceras de seguridad y límite de peticiones (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot(
          buildThrottlerOptions({ ttlSeconds: 60, limit: 3, authLimit: 2 }),
        ),
      ],
      controllers: [PingController, FakeAuthController, HealthController],
      providers: [
        { provide: APP_GUARD, useClass: AppThrottlerGuard },
        GetHealth,
        {
          provide: HEALTH_REPOSITORY,
          useValue: { isDatabaseAvailable: () => Promise.resolve(true) },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('devuelve las cabeceras de Helmet y no X-Powered-By', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['strict-transport-security']).toContain('max-age=');
    expect(res.headers['content-security-policy']).toContain(
      "default-src 'none'",
    );
    expect(res.headers['content-security-policy']).toContain(
      "frame-ancestors 'none'",
    );
  });

  it('relaja la CSP solo en /docs', async () => {
    const res = await request(app.getHttpServer()).get('/docs-json');
    expect(res.headers['content-security-policy']).toContain(
      "default-src 'none'",
    );
    const docs = await request(app.getHttpServer()).get('/docs');
    expect(docs.headers['content-security-policy']).toContain(
      "script-src 'self' 'unsafe-inline'",
    );
  });

  it('el health check no consume el límite', async () => {
    for (let i = 0; i < 6; i += 1) {
      await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    }
  });

  it('responde 429 con Retry-After al superar el límite global', async () => {
    const server = app.getHttpServer();
    for (let i = 0; i < 3; i += 1) {
      await request(server).get('/api/v1/ping').expect(200);
    }
    const res = await request(server).get('/api/v1/ping').expect(429);
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
    expect(res.body).toMatchObject({ statusCode: 429 });
  });

  it('aplica el límite más estricto en /auth/*', async () => {
    const server = app.getHttpServer();
    await request(server).post('/api/v1/auth/login').expect(201);
    await request(server).post('/api/v1/auth/login').expect(201);
    const res = await request(server).post('/api/v1/auth/login').expect(429);
    expect(res.headers['retry-after']).toBeDefined();
  });
});
