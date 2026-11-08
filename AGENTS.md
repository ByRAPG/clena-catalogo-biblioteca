# Instrucciones del repositorio

Estas reglas aplican a personas y agentes de IA. Prevalecen sobre las skills genéricas (`plane-work-management`, `plane-workitem-development`, `collaborative-code-review`).

## Proyecto

- P2 · Catálogo bibliográfico accesible para la Biblioteca del CLENA.
- Plane: workspace del proyecto, proyecto con identificador `CLENA`.
- GitHub: este repositorio. GitHub Projects es la evidencia oficial para el docente; Plane es la herramienta de planificación.

## Stack obligatorio (no admite sustituciones)

- Backend: NestJS + TypeScript bajo Clean Architecture. ORM: Prisma.
- Frontend: React + TypeScript (Vite, Mantine).
- Base de datos: PostgreSQL 16.
- Contenedores: Docker y docker-compose.

## Arquitectura

- Módulos por contexto: `iam`, `catalog`, `search`, `loans`, más `shared`.
- Capas por módulo: `domain` → `application` → `infrastructure` / `presentation`.
- `domain` es TypeScript puro: prohibido importar `@nestjs/*`, `@prisma/*` o cualquier librería de infraestructura.
- Los casos de uso reciben interfaces de repositorio inyectadas por token. Los modelos de Prisma no salen de `infrastructure`; se mapean a entidades de dominio.
- Controladores solo invocan casos de uso.
- API versionada en `/api/v1`, Swagger en `/docs`, salud en `/api/v1/health` (alias `/health`).
- `synchronize`/`db push` prohibido fuera de desarrollo local; siempre migraciones versionadas.

## GitHub Flow

- `main` protegida: sin push directo; requiere PR, aprobación de un code owner (Rafael Potes o Humberto Llinás) y CI en verde.
- Ramas: `feat/<issue>-descripcion`, `fix/<issue>-descripcion`, `docs/...`, `test/...`, `chore/...`, `refactor/...`. Partir siempre de `origin/main` actualizado.
- Commits: Conventional Commits (`feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`, `ci:`).
- PR: referencia el Issue (`Closes #n`) y el work item de Plane (`CLENA-n`), describe qué cambia y cómo probarlo.
- Revisión: un compañero deja una revisión con comentarios (rotación en `CONTRIBUTING.md`); luego aprueba y fusiona Rafael Potes (alterno: Humberto Llinás). Solo ellos aprueban. Squash merge y borrar la rama.

## Estados

| Plane | GitHub Projects |
|---|---|
| Backlog | Backlog |
| Todo | To Do |
| In Progress | In Progress |
| Review & Test, Changes Requested | In Review |
| Done (solo con PR fusionado) | Done |
| Blocked, Cancelled | Se mantiene la columna y se comenta el motivo |

## Validación requerida antes de pedir revisión

- `pnpm run lint`, `pnpm test` y `pnpm run build` en `backend/` y `frontend/`.
- `pnpm run test:e2e` en `backend/` cuando el cambio toca un flujo de la API.
- Cobertura ≥ 70 % en `domain` y `application`.

## Definition of Done

Ver `docs/definition-of-done.md`.

## Documentos que el agente debe leer

- `docs/memoria-critica.md`: roles, fechas, reglas del docente y penalizaciones.
- `docs/flujo-de-trabajo.md`: ciclo de una tarea y ceremonias.
- `docs/guia-ia.md`: cómo usar IA y MCP (y qué no hacer).
- `docs/prompts-por-fase.md`: prompts por fase (entender, planear, implementar, probar, PR, estados, revisión).
- `docs/backlog.md`: historias y criterios. No inventar requisitos fuera de ahí.
- Informes en `docs/`: se entregan en PDF con diagramas de draw.io (nunca Mermaid). Ver `docs/pdf/README.md`.

El producto **no usa IA**. Nunca subir secretos ni datos reales del CLENA.

## Evidencia

- Las fechas de actas deben coincidir con commits, Issues y grabaciones.
- Las grabaciones no se suben al repositorio: se enlazan en `docs/evidencias.md`.
- No se suben datos reales del CLENA ni datos personales. Semillas ficticias.
- Nunca escribir secretos en el código ni en comentarios de Plane o GitHub.
