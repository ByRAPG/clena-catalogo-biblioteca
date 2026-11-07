import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { Env } from './shared/config/env.validation';
import { resolveLogLevels } from './shared/config/log-levels';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.useLogger(resolveLogLevels(config.get('LOG_LEVEL', { infer: true })));
  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }).split(','),
  });
  configureApp(app);
  app.enableShutdownHooks();

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
