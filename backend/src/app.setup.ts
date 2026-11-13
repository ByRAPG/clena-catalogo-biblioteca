import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { json } from 'express';
import { GetHealth } from './shared/application/get-health.use-case';
import { AllExceptionsFilter } from './shared/errors/all-exceptions.filter';

export const API_PREFIX = 'api/v1';

export function configureApp(app: INestApplication): void {
  app.use(json({ limit: '2mb' }));
  // Lee la cookie del refresh token (req.cookies).
  app.use(cookieParser());
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Alias sin prefijo pedido por la Entrega 1 (/health); la ruta oficial es /api/v1/health.
  const getHealth = app.get(GetHealth);
  app.getHttpAdapter().get('/health', (_req: Request, res: Response) => {
    getHealth
      .execute()
      .then((report) => res.json(report))
      .catch(() =>
        res.status(503).json({ status: 'degraded', database: 'down' }),
      );
  });

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('API Biblioteca CLENA')
      .setDescription('Catálogo bibliográfico accesible')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('docs', app, document);
}
