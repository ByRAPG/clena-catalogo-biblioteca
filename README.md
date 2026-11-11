# Consulta Fácil · Catálogo bibliográfico accesible del CLENA (P2)

> Proyecto **P2** del curso Desarrollo de Aplicaciones Web Backend: «Consulta Fácil, rediseño de la interfaz de consulta bibliotecaria».

Aplicación web para que cualquier visitante de la **Biblioteca del CLENA** (Corporación Luis Eduardo Nieto Arteta, complejo de la Aduana de Barranquilla) encuentre un libro por sí mismo, sepa **dónde está** (sala, sección y estante) y si está **disponible**, desde un computador de la biblioteca o desde su celular escaneando un código QR.

## Problema que resuelve

El software actual de consulta es antiguo y poco intuitivo: exige códigos, no tolera errores de escritura y no muestra con claridad la ubicación del material. Los visitantes —incluidos adultos mayores— pierden tiempo, dependen del personal o abandonan la búsqueda, y el personal repite la misma explicación a cada persona.

Problema identificado por el **Grupo 9** de Introducción a la Ingeniería de Sistemas y Computación ([repositorio del análisis](https://github.com/ImDER3K/clena-laboratorio-sistemas-grupo-9)) y consolidado por el docente como el proyecto **P2. Catálogo bibliográfico accesible**.

## Alcance mínimo

- Gestión del catálogo (obras, autores, temas, ejemplares, ubicaciones) con importación desde CSV.
- Búsqueda simple por título, autor o tema, con filtros y tolerancia a errores de escritura.
- Resultado con ubicación física (sala, sección, estante) y disponibilidad (física o digital).
- Acceso desde celular por QR y tutorial guiado para la primera búsqueda.
- Préstamos y alertas de devolución y disponibilidad.

Las 21 historias de usuario (14 escritas por el Grupo 9 y 7 propuestas por Backend) están en [`docs/backlog.md`](docs/backlog.md) y, como fuente oficial, en los Issues y el tablero de GitHub Projects.

## Equipo

### Desarrollo (Desarrollo de Aplicaciones Web Backend, 8.º semestre)

| Integrante | GitHub | Rol |
|---|---|---|
| Rafael Potes Molina | [@ByRAPG](https://github.com/ByRAPG) | Scrum Master · Tech Lead · Release Manager (planificación, sprints, arquitectura, CI/CD, revisión final y merge) |
| Humberto Llinás Marimón | [@lzayrox](https://github.com/lzayrox) | Product Owner · revisor de arquitectura y plan · aprobador alterno de PRs |
| Juan Camilo Fernández Barrios | [@fjuanc](https://github.com/fjuanc) | Development Team |
| Daniel Méndez Aparicio | [@danimendeztv-source](https://github.com/danimendeztv-source) | Development Team |
| Orlando Palma | [@OrlandoPalmaUN](https://github.com/OrlandoPalmaUN) | Development Team |

### Cliente (Grupo 9, Introducción a la Ingeniería de Sistemas)

Shadia Castro Romero (contacto principal) · Derek Pérez · Emiliano Harvey

Docente: Daniel Romero.

## Stack

| Componente | Tecnología |
|---|---|
| Backend | NestJS + TypeScript, Clean Architecture, Prisma |
| Frontend | React + TypeScript + Vite + Mantine |
| Base de datos | PostgreSQL 16 (`pg_trgm`, `unaccent`) |
| Contenedores | Docker y docker-compose |
| Calidad | Jest, Supertest, Vitest, GitHub Actions |
| Gestión | Scrum, GitHub Flow, GitHub Projects y Plane |

Detalle y decisiones en [`docs/arquitectura.md`](docs/arquitectura.md).

## Cómo levantar el proyecto

Para desarrollo local necesitas Docker y Docker Compose. Desde la raíz del repositorio puedes levantar los servicios directamente sin pasos previos de configuración:

```bash
docker compose up --build
```

Docker Compose carga por defecto las variables de desarrollo desde `.env.example`. La creación de un archivo `.env` es opcional y solo se requiere para personalizar credenciales u otras variables locales:

```bash
cp .env.example .env
```

Compose construye la URL de la base de datos en el backend con `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB` (por defecto `clena`, `change-me` y `clena_catalogo`); usa letras, números, guiones o guiones bajos en estos valores para que la URL sea válida. Si defines un archivo `.env`, sus variables tendrán precedencia sobre `.env.example`. Una vez inicializado el volumen de PostgreSQL, cambiar estas variables no modifica las credenciales ni la base ya existentes.

- Frontend: http://localhost:5173
- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/docs
- Salud: http://localhost:3000/api/v1/health (alias `/health` para la Entrega 1)
- Mailpit: http://localhost:8025; SMTP disponible para los contenedores en `mailpit:1025`.
- PostgreSQL: `localhost:5433` para herramientas y clientes locales en el host (evita conflictos con el puerto 5432); los contenedores se comunican internamente en `db:5432`.

El backend aplica las migraciones y ejecuta una semilla técnica ficticia al arrancar. Los datos de PostgreSQL persisten en el volumen `postgres_data` al reiniciar los contenedores. Para detener los servicios, usa `docker compose down`; el volumen se conserva.

Para validar el código, ejecuta `pnpm run lint`, `pnpm test` y `pnpm run build` en `backend/` y `frontend/`. La cobertura del backend se comprueba con `pnpm run test:cov`.

## Importación CSV (HU-12)

La pantalla está en `/gestion/importar` y requiere una sesión con rol ADMIN. Permite descargar la plantilla existente, seleccionar un CSV UTF-8 separado por comas de hasta 1 MB e importar las filas válidas aunque otras tengan errores. El reporte muestra el resultado de cada fila y totales de ejemplares creados, actualizados y fallidos.

La API ofrece `GET /api/v1/catalog/imports/template` y `POST /api/v1/catalog/imports`. El POST recibe JSON con `fileName` y `content`; el usuario se obtiene de la autenticación y nunca del archivo o del cuerpo de la solicitud. Las cabeceras deben coincidir con `backend/prisma/data/plantilla-catalogo.csv`; los autores y temas se separan con `;`. Los números del reporte corresponden a líneas del archivo; si una celda contiene saltos de línea, se indica la línea final del registro.

Cada fila se guarda en una transacción independiente. Se reutilizan obras por ISBN y ejemplares por código de inventario. Sin ISBN, se conserva la obra del ejemplar existente; para nuevas obras importadas se deriva una identidad de título, autores normalizados, año, editorial y clasificación. Esto evita duplicados al repetir el mismo archivo sin fusionar automáticamente obras preexistentes de otras fuentes. Las celdas opcionales vacías borran el valor correspondiente al actualizar; las listas de autores y temas reemplazan las relaciones actuales de la obra.

El historial `ImportJob` conserva el administrador, nombre del archivo, totales y errores. Un fallo de infraestructura interrumpe el proceso y conserva las filas ya confirmadas; no debe interpretarse como una reversión de toda la carga.

La autenticación está pendiente de HU-09 por decisión de integración: el token `IMPORT_AUTHENTICATOR` exige una implementación de `IImportAuthenticator` que valide el access token y devuelva un usuario activo. El adaptador provisional rechaza el acceso; no hay tokens de demostración aceptados por la aplicación. Las pruebas e2e sustituyen únicamente ese puerto para verificar el flujo real con PostgreSQL.

Para probarlo en Docker:

```bash
docker compose exec backend pnpm run lint
docker compose exec backend pnpm test --runInBand
docker compose exec backend pnpm run test:cov --runInBand
docker compose exec backend sh -c 'E2E_DATABASE_URL="$DATABASE_URL" pnpm run test:e2e --runInBand'
docker compose exec backend pnpm run build
docker compose exec frontend pnpm run lint
docker compose exec frontend pnpm test
docker compose exec frontend pnpm run build
```

Las pruebas e2e de importación crean una base temporal, aplican las migraciones versionadas y la eliminan al terminar. La conexión de pruebas debe permitir crear bases de datos. Las pruebas de búsqueda y QR leen la semilla ficticia de la base indicada en `E2E_DATABASE_URL`. No se vacía la base configurada.

## Aplicación desplegada

Pendiente: el despliegue con URL pública (T-07) se hace en el Sprint 3.

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/backlog.md`](docs/backlog.md) | Historias de usuario, prioridad y estimación |
| [`docs/arquitectura.md`](docs/arquitectura.md) | Capas, regla de dependencia y decisiones técnicas |
| [`docs/modelo-datos.md`](docs/modelo-datos.md) | Diagrama entidad-relación |
| [`docs/plan-proyecto.md`](docs/plan-proyecto.md) | Calendario, sprints, ceremonias y riesgos |
| [`docs/memoria-critica.md`](docs/memoria-critica.md) | Roles, fechas, reglas del docente y decisiones (leer primero) |
| [`docs/flujo-de-trabajo.md`](docs/flujo-de-trabajo.md) | Ciclo de una tarea y ceremonias, con ejemplo |
| [`docs/guia-ia.md`](docs/guia-ia.md) | Cómo trabajar con IA y MCP |
| [`docs/prompts-por-fase.md`](docs/prompts-por-fase.md) | Prompts para copiar y pegar en cada fase de una tarea |
| [`docs/definition-of-done.md`](docs/definition-of-done.md) | Cuándo una tarea está terminada |
| [`docs/sprint-planning.md`](docs/sprint-planning.md), [`daily-scrum.md`](docs/daily-scrum.md), [`sprint-review.md`](docs/sprint-review.md), [`sprint-retrospective.md`](docs/sprint-retrospective.md) | Actas de Scrum por sprint |
| [`docs/evidencias.md`](docs/evidencias.md) | Enlaces a grabaciones de Teams por fecha |
| [`docs/actas/`](docs/actas) | Una acta por reunión |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | GitHub Flow, ramas, commits y revisión |

### Informes de la Entrega 1 (PDF)

Los `.md` son la fuente. Los informes que pide el docente se generan en PDF con `docs/pdf` (portada, índice y números de página; diagramas de draw.io) y se publican en `docs/`.

| Informe | Markdown (fuente) | PDF | Estado |
|---|---|---|---|
| Inception | `docs/inception.md` | `docs/inception.pdf` | Listo |
| Evidencias | `docs/evidencias.md` | `docs/evidencias.pdf` | Listo |
| Modelo de dominio | por definir (T-13) | `docs/modelo-dominio.pdf` | Pendiente (T-13) |
| Modelo de datos | `docs/modelo-datos.md` | `docs/modelo-datos.pdf` | Pendiente (T-06) |
| Arquitectura (C4 niveles 1 a 3) | `docs/arquitectura.md` | `docs/arquitectura.pdf` | Listo (T-08) |
| Daily Scrum | `docs/daily-scrum.md` | `docs/daily-scrum.pdf` | Listo |

## Uso de inteligencia artificial

El docente permite usar IA como asistente. El equipo la usa de forma transparente y con estas reglas:

- **Para qué se usa:** apoyo en planificación (organización del backlog y los sprints), redacción y revisión de documentación, sugerencias de código, pruebas y revisión de Pull Requests.
- **Qué no se delega:** las decisiones de producto (las toman el Product Owner y el Grupo 9), la aprobación de los Pull Requests y la aceptación de riesgos. Las actas reflejan reuniones reales con su grabación.
- **Responsabilidad:** quien sube un cambio lo entiende, lo prueba y puede explicarlo y modificarlo en la sustentación. Todo código, con o sin ayuda de IA, pasa por Pull Request, CI, revisión de un compañero y aprobación de Rafael Potes o Humberto Llinás.
- **Datos:** no se comparten con herramientas de IA datos personales, credenciales ni información del CLENA que no sea pública.
- **Producto:** la aplicación **no usa IA** en esta etapa.

## Datos y privacidad

- Las semillas de demostración son ficticias. No se publican datos reales del CLENA sin autorización escrita.
- El aviso provisional está en `/privacidad` y en [`docs/aviso-privacidad.md`](docs/aviso-privacidad.md). La integración de aceptación expresa y registro de versión/fecha depende de IAM (HU-16); la eliminación de cuentas depende de HU-17. El responsable institucional y el canal de contacto requieren confirmación antes de tratar datos reales.

## Licencia

El repositorio contiene una licencia MIT propuesta por el equipo. Su confirmación con el CLENA y la universidad está pendiente; no cubre automáticamente datos bibliográficos, archivos digitales ni otros contenidos de terceros.
