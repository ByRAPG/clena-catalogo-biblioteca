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
| Daniel Méndez Aparicio | [@danyrpppp](https://github.com/danyrpppp) | Development Team |
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

> Se completa en el Sprint 1 cuando exista el esqueleto del código.

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/docs
- Salud: http://localhost:3000/health

## Aplicación desplegada

Pendiente (Sprint 1).

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/backlog.md`](docs/backlog.md) | Historias de usuario, prioridad y estimación |
| [`docs/arquitectura.md`](docs/arquitectura.md) | Capas, regla de dependencia y decisiones técnicas |
| [`docs/modelo-datos.md`](docs/modelo-datos.md) | Diagrama entidad-relación |
| [`docs/plan-proyecto.md`](docs/plan-proyecto.md) | Calendario, sprints, ceremonias y riesgos |
| [`docs/definition-of-done.md`](docs/definition-of-done.md) | Cuándo una tarea está terminada |
| [`docs/sprint-planning.md`](docs/sprint-planning.md), [`daily-scrum.md`](docs/daily-scrum.md), [`sprint-review.md`](docs/sprint-review.md), [`sprint-retrospective.md`](docs/sprint-retrospective.md) | Actas de Scrum por sprint |
| [`docs/evidencias.md`](docs/evidencias.md) | Enlaces a grabaciones de Teams por fecha |
| [`docs/actas/`](docs/actas) | Una acta por reunión |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | GitHub Flow, ramas, commits y revisión |

## Uso de inteligencia artificial

El docente permite usar IA como asistente. El equipo la usa de forma transparente y con estas reglas:

- **Para qué se usa:** apoyo en planificación (organización del backlog y los sprints), redacción y revisión de documentación, sugerencias de código, pruebas y revisión de Pull Requests.
- **Qué no se delega:** las decisiones de producto (las toman el Product Owner y el Grupo 9), la aprobación de los Pull Requests y la aceptación de riesgos. Las actas reflejan reuniones reales con su grabación.
- **Responsabilidad:** quien sube un cambio lo entiende, lo prueba y puede explicarlo y modificarlo en la sustentación. Todo código, con o sin ayuda de IA, pasa por Pull Request, CI, revisión de un compañero y aprobación de Rafael Potes o Humberto Llinás.
- **Datos:** no se comparten con herramientas de IA datos personales, credenciales ni información del CLENA que no sea pública.
- **Producto:** la aplicación **no usa IA** en esta etapa.

## Datos y privacidad

- Las semillas de demostración son ficticias. No se publican datos reales del CLENA sin autorización escrita.
- El sistema cumple la Ley 1581 de 2012: aviso de privacidad, consentimiento explícito, datos mínimos y opción de eliminar la cuenta.

## Licencia

Por definir con el CLENA y la universidad antes de la entrega final.
