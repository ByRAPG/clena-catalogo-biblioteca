import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { Env } from './shared/config/env.validation';
import { resolveLogLevels } from './shared/config/log-levels';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  // Detrás de un proxy inverso la IP real llega en X-Forwarded-For. Solo se
  // confía en ese encabezado si TRUST_PROXY lo indica; de lo contrario cualquiera
  // podría falsearlo y esquivar el límite de peticiones por IP.
  app
    .getHttpAdapter()
    .getInstance()
    .set('trust proxy', config.get('TRUST_PROXY', { infer: true }));

  app.useLogger(resolveLogLevels(config.get('LOG_LEVEL', { infer: true })));
  app.enableCors({
    origin: config
      .get('CORS_ORIGIN', { infer: true })
      .split(',')
      .map((origin) => origin.trim()),
    // El navegador solo envía la cookie del refresh token si el CORS lo permite.
    credentials: true,
    // Sin esto el frontend no puede leer Retry-After en la respuesta 429.
    exposedHeaders: ['Retry-After'],
  });
  configureApp(app);
  app.enableShutdownHooks();

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
