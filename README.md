# Busca Fácil · Catálogo bibliográfico accesible del CLENA (P2)

> Proyecto **P2** del curso Desarrollo de Aplicaciones Web Backend: «Consulta Fácil, rediseño de la interfaz de consulta bibliotecaria». El producto se presenta al público con el nombre **Busca Fácil**.

Aplicación web para que cualquier visitante de la **Biblioteca del CLENA** (Corporación Luis Eduardo Nieto Arteta, complejo de la Aduana de Barranquilla) encuentre un libro por sí mismo, sepa **dónde está** (sala, sección y estante) y si está **disponible**, desde un computador de la biblioteca o desde su celular escaneando un código QR.

## Problema que resuelve

El software actual de consulta es antiguo y poco intuitivo: exige códigos, no tolera errores de escritura y no muestra con claridad la ubicación del material. Los visitantes —incluidos adultos mayores— pierden tiempo, dependen del personal o abandonan la búsqueda, y el personal repite la misma explicación a cada persona.

Problema identificado por el **Grupo 9** de Introducción a la Ingeniería de Sistemas y Computación ([repositorio del análisis](https://github.com/ImDER3K/clena-laboratorio-sistemas-grupo-9)) y consolidado por el docente como el proyecto **P2. Catálogo bibliográfico accesible**.

## Alcance mínimo

- Gestión del catálogo (obras, autores, temas, ejemplares, ubicaciones) con importación desde CSV.
- Búsqueda simple por título, autor o tema, con filtros y tolerancia a errores de escritura.
- Resultado con ubicación física (sala, sección, estante) y disponibilidad (física o digital).
- Acceso desde celular por QR y tutorial guiado para la primera búsqueda.
- Préstamos y devoluciones registrados por el personal (HU-20). Las alertas de devolución y disponibilidad y las reservas no se terminaron (ver el estado por historia en [`docs/backlog.md`](docs/backlog.md)).

**Búsqueda semántica.** La búsqueda es híbrida: combina la léxica (`pg_trgm` y `unaccent`) con la vectorial (modelo local `multilingual-e5-small` y pgvector) mediante Reciprocal Rank Fusion; si el modelo no está listo o se apaga con `SEMANTIC_SEARCH=off`, responde solo con la léxica (degradación). No envía datos a terceros (ADR-08 en [`docs/arquitectura.md`](docs/arquitectura.md)).

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
| Base de datos | PostgreSQL 16 (`pg_trgm`, `unaccent`; imagen `pgvector` para la búsqueda semántica) |
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

La pantalla está en `/gestion/importar` y requiere una sesión con rol ADMIN (el comando para crear el primer administrador está en la sección de despliegue). Permite descargar la plantilla existente, seleccionar un CSV UTF-8 separado por comas de hasta 1 MB e importar las filas válidas aunque otras tengan errores. El reporte muestra el resultado de cada fila y totales de ejemplares creados, actualizados y fallidos.

La API ofrece `GET /api/v1/catalog/imports/template` y `POST /api/v1/catalog/imports`. El POST recibe JSON con `fileName` y `content`; el usuario se obtiene de la autenticación y nunca del archivo o del cuerpo de la solicitud. Las cabeceras deben coincidir con `backend/prisma/data/plantilla-catalogo.csv`; los autores y temas se separan con `;`. Los números del reporte corresponden a líneas del archivo; si una celda contiene saltos de línea, se indica la línea final del registro.

Cada fila se guarda en una transacción independiente. Se reutilizan obras por ISBN y ejemplares por código de inventario. Sin ISBN, se conserva la obra del ejemplar existente; para nuevas obras importadas se deriva una identidad de título, autores normalizados, año, editorial y clasificación. Esto evita duplicados al repetir el mismo archivo sin fusionar automáticamente obras preexistentes de otras fuentes. Las celdas opcionales vacías borran el valor correspondiente al actualizar; las listas de autores y temas reemplazan las relaciones actuales de la obra.

El historial `ImportJob` conserva el administrador, nombre del archivo, totales y errores. Un fallo de infraestructura interrumpe el proceso y conserva las filas ya confirmadas; no debe interpretarse como una reversión de toda la carga.

La importación y la plantilla exigen un access token válido de un usuario ADMIN (`JwtAuthGuard` y `RolesGuard`). Las pruebas e2e usan la autenticación real con la base temporal.

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

## Despliegue en producción

`docker-compose.prod.yml` levanta todo en una sola máquina Linux (2 a 4 GB de RAM) con un único origen: Caddy sirve el frontend, reenvía `/api/*` al backend y obtiene el certificado HTTPS solo. Solo `web` publica puertos (80 y 443); la base de datos y la API viven en una red interna sin salida a internet. No corre la semilla de demostración.

Requisitos: Docker con Compose v2 y un dominio con registro DNS apuntando a la máquina (puertos 80 y 443 abiertos).

```bash
cp .env.prod.example .env.prod
# Edita .env.prod: SITE_ADDRESS y PUBLIC_WEB_URL con tu dominio, y los secretos:
openssl rand -hex 24   # POSTGRES_PASSWORD
openssl rand -hex 32   # JWT_ACCESS_SECRET (genera otro distinto para JWT_REFRESH_SECRET)

docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.prod -f docker-compose.prod.yml ps   # los 3 servicios en "healthy"
curl -i https://TU-DOMINIO/api/v1/health
```

**Crear el primer administrador.** La semilla de demostración no corre en producción, así que una instalación nueva no tiene ninguna cuenta. Crea la primera con el comando del backend; los datos van por variables de entorno (nunca por argumentos) y la contraseña no se imprime. Evita que la contraseña quede en el historial del shell: léela con `read -s`.

```bash
read -rsp 'Contraseña del administrador (mínimo 12 caracteres): ' ADMIN_PASSWORD; echo
docker compose --env-file .env.prod -f docker-compose.prod.yml exec \
  -e ADMIN_EMAIL=admin@tu-dominio.org -e ADMIN_PASSWORD \
  -e ADMIN_FULL_NAME='Nombre del administrador' \
  backend node dist/modules/iam/presentation/create-admin.cli.js
unset ADMIN_PASSWORD
```

`-e ADMIN_PASSWORD` sin valor toma la variable del shell actual, así que la contraseña no aparece en la línea de comandos. `ADMIN_FULL_NAME` es opcional (por defecto «Administrador»). Es idempotente: si el correo ya existe, no cambia su contraseña ni su rol y lo avisa (código de salida 0). Si ya hay un administrador activo, se niega (código 3); para crear otro a propósito añade `-e ADMIN_ALLOW_ADDITIONAL=true`. Alternativa que evita la contraseña en el entorno (visible en `docker inspect`): monta un archivo de solo lectura con la contraseña y pasa `-e ADMIN_PASSWORD_FILE=/ruta/al/archivo` en lugar de `ADMIN_PASSWORD`; se descarta el salto de línea final. La política rechaza contraseñas de una lista corta de las más comunes. No guardes `ADMIN_PASSWORD` en `.env.prod`. En desarrollo: `pnpm iam:create-admin` en `backend/` con las mismas variables.

`.env.prod` está ignorado por git; no lo subas. Con `SITE_ADDRESS=:80` el sitio se sirve por HTTP sin TLS (solo pruebas): la cookie de sesión es `Secure` y el navegador no la guarda fuera de `localhost`.

**Actualizar**: `git pull` y repetir el comando `up -d --build`. El backend aplica las migraciones al arrancar.

**Registros**: `docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f --tail=100 backend` (o `web`, `db`).

**Copia de seguridad y restauración** (leen las credenciales del propio contenedor `db`):

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T db   sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > backups/clena-$(date +%F).dump

# Restaurar sobre una base vacía (detén antes el backend: ... stop backend)
docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T db   sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < backups/clena-AAAA-MM-DD.dump
```

`backups/` está ignorado por git. Guarda las copias fuera de la máquina.

Notas de seguridad del servidor web (`frontend/Caddyfile`): la política `Content-Security-Policy` no permite scripts en línea; Mantine inserta una etiqueta `<style>` con sus variables CSS al arrancar, por lo que `style-src-elem` admite `'unsafe-inline'` (solo para etiquetas `<style>`; los atributos `style=""` del HTML siguen bloqueados). `TRUST_PROXY=1` (valor por defecto del compose) indica a la API que hay un proxy de confianza delante, para que el límite de peticiones use la IP real del visitante.

## Aplicación desplegada

El despliegue con URL pública (T-07) está descrito en [`docs/despliegue.md`](docs/despliegue.md): la opción A es un túnel rápido de Cloudflare desde un equipo propio con `docker-compose.tunnel.yml` (la URL `trycloudflare.com` cambia en cada reinicio del túnel y el sitio solo está disponible mientras el equipo esté encendido) y la opción B, Hugging Face Spaces con Neon, está descrita pero no implementada. Los controles de seguridad y las cabeceras medidas están en [`docs/informe-seguridad.md`](docs/informe-seguridad.md).

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
| [`docs/despliegue.md`](docs/despliegue.md) | Despliegue con URL pública: túnel de Cloudflare (opción A) y Hugging Face Spaces con Neon (opción B) |
| [`docs/aviso-privacidad.md`](docs/aviso-privacidad.md) | Aviso de privacidad (Ley 1581 de 2012) |
| [`docs/recursos-de-terceros.md`](docs/recursos-de-terceros.md) | Logos y fotos de terceros incluidos y cómo se retiran |
| [`docs/guia-visual.md`](docs/guia-visual.md) | Guía visual de la interfaz |
| [`docs/actas/`](docs/actas) | Una acta por reunión |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | GitHub Flow, ramas, commits y revisión |

### Informes y documentos en PDF

Los `.md` son la fuente. Los informes que pide el docente se generan en PDF con `docs/pdf` (portada, índice y números de página; diagramas de draw.io) y se publican en `docs/`.

| Informe | Markdown (fuente) | PDF |
|---|---|---|
| Inception | `docs/inception.md` | `docs/inception.pdf` |
| Daily Scrum | `docs/daily-scrum.md` | `docs/daily-scrum.pdf` |
| Evidencias | `docs/evidencias.md` | `docs/evidencias.pdf` |
| Modelo de dominio | `docs/modelo-dominio.md` | `docs/modelo-dominio.pdf` |
| Modelo de datos | `docs/modelo-datos.md` | `docs/modelo-datos.pdf` |
| Arquitectura (C4 niveles 1 a 3) | `docs/arquitectura.md` | `docs/arquitectura.pdf` |
| Informe de seguridad | `docs/informe-seguridad.md` | `docs/informe-seguridad.pdf` |
| Evaluación de la búsqueda semántica | `docs/informe-evaluacion-busqueda.md` | `docs/informe-evaluacion-busqueda.pdf` |
| Manual de usuario | `docs/manual-usuario.md` | `docs/manual-usuario.pdf` |

Para regenerar uno: en `docs/pdf`, `pnpm install --frozen-lockfile` y `node build.mjs <id> --fecha "<fecha>"`, con los ids de `docs/pdf/documentos.json`.

## Uso de inteligencia artificial

El docente permite usar IA como asistente. El equipo la usa de forma transparente y con estas reglas:

- **Para qué se usa:** apoyo en planificación (organización del backlog y los sprints), redacción y revisión de documentación, sugerencias de código, pruebas y revisión de Pull Requests.
- **Qué no se delega:** las decisiones de producto (las toman el Product Owner y el Grupo 9), la aprobación de los Pull Requests y la aceptación de riesgos. Las actas reflejan reuniones reales con su grabación.
- **Responsabilidad:** quien sube un cambio lo entiende, lo prueba y puede explicarlo y modificarlo en la sustentación. Todo código, con o sin ayuda de IA, pasa por Pull Request, CI, revisión de un compañero y aprobación de Rafael Potes o Humberto Llinás.
- **Datos:** no se comparten con herramientas de IA datos personales, credenciales ni información del CLENA que no sea pública.
- **Producto:** la aplicación **no usa IA generativa ni servicios externos de IA**. Solo está aprobado un modelo de embeddings de código abierto que corre en el propio servidor, sin enviar datos a terceros, para ordenar resultados de búsqueda (ADR-08, implementado).

## Datos y privacidad

- Las semillas de demostración son ficticias. No se publican datos reales del CLENA sin autorización escrita.
- El aviso de privacidad está en `/privacidad` y en [`docs/aviso-privacidad.md`](docs/aviso-privacidad.md). El registro de aceptación expresa con versión y fecha depende de la cuenta de lector (HU-16) y la eliminación de cuentas de HU-17; ninguna de las dos está terminada, por lo que la aplicación no trata datos personales de lectores. El responsable institucional y el canal de contacto se confirman con el CLENA antes de tratar datos reales.
- La búsqueda semántica (ADR-08) corre en el propio servidor y no envía consultas ni datos personales a terceros.

## Licencia

El código fuente del prototipo académico se distribuye bajo la licencia MIT ([`LICENSE`](LICENSE)) por decisión del equipo, sin confirmación formal del CLENA ni del docente. Esta licencia excluye los logotipos y fotos de terceros (ver [`docs/recursos-de-terceros.md`](docs/recursos-de-terceros.md)), los datos bibliográficos reales, los archivos digitales y otros contenidos de terceros.
