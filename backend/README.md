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

Variables validadas al arrancar (zod, `src/shared/config/env.validation.ts`): `PORT`, `DATABASE_URL`, `CORS_ORIGIN`, `TRUST_PROXY`, `THROTTLE_TTL_SECONDS`, `THROTTLE_LIMIT`, `THROTTLE_AUTH_LIMIT`, `LOG_LEVEL`, `JWT_*`. Si falta una obligatoria, la API no inicia.

Búsqueda semántica: `SEMANTIC_SEARCH=on|off` (por defecto `off`) y `EMBEDDING_PROVIDER=fake|local` (por defecto `fake`; `local` aún no está implementado y falla al arrancar con la semántica activa).

Consulta semántica (solo con `SEMANTIC_SEARCH=on`): `SEMANTIC_TIMEOUT_MS` (800), `SEMANTIC_MAX_CONCURRENCY` (2), `SEMANTIC_CACHE_SIZE` (500; `0` desactiva la caché) y `SEMANTIC_CACHE_TTL_SECONDS` (600). Si el modelo falla, tarda más del tiempo o no hay cupo, la API responde solo con la búsqueda léxica y `meta.degraded = true`. Un mismo cliente puede ocupar los cupos; el límite de peticiones por IP llega con el PR #109.

Calidad de la semántica: `SEARCH_MIN_SIMILARITY` (0,835; similitud coseno mínima para contar un resultado vectorial), `SEARCH_RELATIVE_CUTOFF` (0,03; distancia máxima al mejor resultado, `1` la desactiva) y `SEARCH_LEXICAL_WEIGHT` (2; peso de la léxica en la fusión). Con e5 las similitudes entre textos sin relación también son altas (0,75 a 0,83), por eso el umbral se calibra midiendo: `pnpm search:eval --base-url <api>` (consultas de `test/fixtures/search-eval.json` sobre la semilla ficticia; recall@10, nDCG@10, MRR, precisión y falsos positivos en consultas sin respuesta, por modo). Cada resultado trae `matchSource` (`lexical`, `semantic` o `both`) cuando hay `q`.

Reindexado de embeddings (solo con `SEMANTIC_SEARCH=on`): `SEMANTIC_REINDEX_INTERVAL_SECONDS` (por defecto 300; `0` lo limita a una pasada al arrancar) y `SEMANTIC_REINDEX_BATCH_SIZE` (por defecto 16). La API reindexa en segundo plano al arrancar y por intervalo; solo procesa obras sin vector, con otro modelo o con el texto cambiado. Para forzarlo a mano:

```bash
pnpm run search:reindex        # compila y ejecuta; imprime el resumen JSON y sale con código 1 si hubo fallos
pnpm run search:reindex:dist   # producción: sobre un build ya hecho (node dist/modules/search/presentation/search-reindex.cli.js)
```

No usa `tsx` porque Nest necesita los metadatos de decoradores que `tsx` no emite.

Búsqueda semántica: `SEMANTIC_SEARCH=on|off` (por defecto `off`) y `EMBEDDING_PROVIDER=fake|local` (por defecto `fake`; `local` aún no está implementado y falla al arrancar con la semántica activa).

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

En producción, `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` deben tener al menos 32 caracteres. `CORS_ORIGIN` admite varios orígenes separados por coma y rechaza `*`. Detrás de un proxy inverso (Render, Railway) define `TRUST_PROXY=1` para que el límite de peticiones use la IP real; con el valor por defecto (`false`) se ignora `X-Forwarded-For`. Swagger (`/docs`) no se monta con `NODE_ENV=production`.

## Imagen de producción

Imagen multi-etapa (`node:22-bookworm-slim`, usuario `node` sin privilegios, solo `dist`, dependencias de producción, `prisma/` y `package.json`). El entrypoint ejecuta `prisma migrate deploy` y luego `node dist/main`; no corre la semilla.

```bash
docker build --target production -t clena-backend:prod backend
docker run -d --name clena-backend -p 3000:3000 \
  -e NODE_ENV=production -e DATABASE_URL=... \
  -e JWT_ACCESS_SECRET=... -e JWT_REFRESH_SECRET=... \
  clena-backend:prod
```

Los secretos JWT deben tener al menos 32 caracteres. Se pasan por variables de entorno, nunca dentro de la imagen. La imagen trae `HEALTHCHECK` contra `/api/v1/health`. El desarrollo sigue usando `--target development` (lo hace `docker-compose.yml`).
