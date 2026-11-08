# Backend – Biblioteca CLENA

API NestJS + TypeScript + Prisma (PostgreSQL 16) bajo Clean Architecture. Prefijo `/api/v1`, Swagger en `/docs`, salud en `/api/v1/health`.

## Requisitos

- Node.js 22 y pnpm 12.18.0 (versión fijada en `packageManager`). Activa pnpm una sola vez con `corepack enable`; si falla por permisos, usa `corepack enable --install-directory <carpeta en tu PATH>`.
- Usa siempre `pnpm`. No ejecutes `npm install`: crearía un `package-lock.json` que no se versiona.

## Cómo correr

```bash
pnpm install                 # también ejecuta prisma generate
cp ../.env.example .env     # ajusta DATABASE_URL (localhost si corres fuera de Docker)
pnpm run prisma:migrate:deploy
pnpm run start:dev
```

Variables validadas al arrancar (zod, `src/shared/config/env.validation.ts`): `PORT`, `DATABASE_URL`, `CORS_ORIGIN`, `LOG_LEVEL`, `JWT_*`. Si falta una obligatoria, la API no inicia.

## Probar

```bash
pnpm run lint
pnpm test            # unitarias
pnpm run test:cov    # cobertura de domain y application (umbral 70 %)
pnpm run test:e2e    # supertest, sin base de datos real
pnpm run build
```

## Capas

```text
src/
  modules/{iam,catalog,search,loans}/
    domain/          TypeScript puro (sin @nestjs/* ni @prisma/*; lo verifica ESLint)
    application/     casos de uso y puertos (interfaces + token de inyección)
    infrastructure/  adaptadores (Prisma, etc.)
    presentation/    controladores, DTO (class-validator), Swagger
  shared/            config, errors (filtro global), Prisma y health (ejemplo con las 4 capas)
```

Los controladores solo llaman casos de uso; los repositorios se inyectan por token. Los errores salen como `{ statusCode, error, message, path, timestamp }`.

## Base de datos

Solo migraciones versionadas en `prisma/migrations/` (nunca `db push` fuera de local). La migración inicial habilita `pg_trgm` y `unaccent` y crea la tabla mínima `schema_info`; el modelo real llega con T-06.

## Validación de entrada

El `ValidationPipe` global usa `whitelist` y `forbidNonWhitelisted`: si el cliente envía un campo que el DTO no declara, la API responde 400. Declare todos los campos en el DTO.

En producción, `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` deben tener al menos 32 caracteres. `CORS_ORIGIN` admite varios orígenes separados por coma.
