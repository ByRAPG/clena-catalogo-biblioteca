# Memoria crítica del proyecto

> Lo que no se puede olvidar. Si algo contradice este archivo, gana este archivo (salvo que el docente indique lo contrario por escrito). Actualizada: 7 nov 2026.

## 1. Proyecto

- **Consulta Fácil**, proyecto P2 de Desarrollo de Aplicaciones Web Backend: catálogo bibliográfico accesible para la biblioteca del CLENA, Universidad del Norte.
- Cliente: Grupo 9 de Introducción a la Ingeniería de Sistemas. Docente: Daniel Romero (`djromerom`, djromero@uninorte.edu.co).
- Repositorio: https://github.com/ByRAPG/clena-catalogo-biblioteca. Plane: workspace `clena-library`, proyecto `CLENA`.

## 2. Roles

| Persona | GitHub | Rol |
|---|---|---|
| Rafael Potes Molina | `ByRAPG` | Scrum Master · Tech Lead · Release Manager · **aprobador principal** (planifica, revisa al final y fusiona) |
| Humberto Llinás Marimón | `lzayrox` | **Product Owner** de Backend · revisor de arquitectura y plan · **aprobador alterno** · infraestructura Docker (T-04) |
| Juan Camilo Fernández Barrios | `fjuanc` | Development Team |
| Daniel Méndez Aparicio | `danyrpppp` | Development Team |
| Orlando Palma | `OrlandoPalmaUN` | Development Team |
| Shadia Castro Romero | `shadiacas-creator` | Grupo 9 · contacto principal |
| Derek Pérez | `ImDER3K` | Grupo 9 |
| Emiliano Harvey | `Harvey04-ish` | Grupo 9 · **PO del Grupo 9** |

Solo Rafael o Humberto aprueban y fusionan (CODEOWNERS). Antes, un compañero deja una revisión **Comment**: Juan Camilo → Daniel, Daniel → Orlando, Orlando → Juan Camilo. Los PRs de Rafael y Humberto los comenta quien tenga menos revisiones esa semana.

## 3. Fechas

| Fecha | Qué |
|---|---|
| 6–8 nov | Sprint 0 · Inception (kickoff sáb 7, Planning sáb/dom 8) |
| 9–13 nov | Sprint 1. Review de avance con el G9 el **mar 10**. Dailies 9, 11 y 12 |
| mié 11 nov | Entrega 1 del Grupo 9 |
| **vie 13 nov, 9:00 am** | **Entrega 1 de Backend** (tag `entrega-1`) |
| 14–19 nov | Sprint 2 |
| 20–25 nov | Sprint 3. Entrega final el 25 (por confirmar con el docente) |

## 4. Reglas del docente (Entrega 1 de Backend)

- Informes en `docs/` en **PDF**, con portada, índice y números de página. Sin eso no se califican.
- Diagramas como **imagen** (draw.io), con número y título. **Mermaid y PlantUML no se aceptan.**
- Entregables: `inception.pdf`, `evidencias.pdf`, `modelo-dominio.pdf`, `modelo-datos.pdf`, `arquitectura.pdf` (C4 niveles 1–3), `daily-scrum.pdf`.
- ≥ 15 historias en Issues (Como/quiero/para, ≥ 2 criterios Dado/Cuando/Entonces, puntos Fibonacci, etiqueta `prioridad:*`). Validadas por el G9.
- Base técnica: monorepo `backend/` + `frontend/`, 4 capas, `/api/v1/health`, `/docs`, PostgreSQL ≥ 15, migración, `docker compose up` con todo, `.env.example`, GitHub Actions (lint, test, build), README con roles.
- **80 %** de lo obligatorio terminado de verdad: caso de uso + controlador, migración + seed, Swagger + DTO + paginación, pantalla React con ruta protegida, prueba en CI y criterios demostrables en vivo.
- Scrum: tablero Backlog/To Do/In Progress/In Review/Done (a Done solo con PR fusionado), milestone Sprint 1, ≥ 3 dailies grabadas por semana o 1 weekly, `main` protegida con ≥ 1 aprobación y CI en verde.
- Cada integrante: ≥ 1 commit, 1 PR propio y 1 revisión de un PR ajeno. Quien no aporta pierde hasta 90 % de la nota.
- Entrega: tag `entrega-1`, URLs del repo, tablero y `evidencias.pdf`; `djromerom` como colaborador; presentación de 10 minutos donde **cada uno explica lo que subió**.

## 5. Penalizaciones (evitarlas)

| Falta | Costo |
|---|---|
| Entrega tarde | −20 por día |
| Secretos en el repo | −15 |
| Datos reales del CLENA sin autorización escrita | −20 y retiro del repo |
| Archivos pesados en el repo (grabaciones, bases de datos) | −5 |
| Actas genéricas o fechas incoherentes con commits, Issues y grabaciones | Scrum = 0 |
| Informe en Markdown, diagrama Mermaid | No se califica |

## 6. Decisiones tomadas

- **Stack:** NestJS (Clean Architecture) + Prisma, React + Vite + Mantine, PostgreSQL 16 con `pg_trgm` y `unaccent`, Docker, Mailpit en local.
- **Backlog:** 21 historias (HU-01…14 del G9, HU-15…21 de Backend) y 14 habilitadores técnicos (T-01…14). En Plane, `HU-n` = `CLENA-n` y `T-01…14` = `CLENA-22…35`.
- **Fuente oficial:** GitHub Issues, Milestones y Projects. Plane es planificación interna.
- **GitHub:** repo público, squash merge, ramas borradas al fusionar, `main` protegida.
- **Licencia:** MIT (propuesta del equipo; confirmar con el CLENA).
- **Chat de atención:** fuera del alcance. Pertenece a la Sala de Internet (P1). Mapa, cita y analítica son solo sugerencias.
- **IA:** permitida como asistente en el desarrollo. El producto **no usa IA**.
- **Datos:** solo semillas ficticias hasta tener autorización escrita del CLENA.

## 7. Pendientes críticos

- Licencia y aviso de privacidad antes del Sprint 1 (T-14).
- Confirmar fechas finales con el docente.
- Check de CI obligatorio en `main` cuando exista T-05.
- Grabaciones válidas: kickoff 7 nov, review 10 nov, review 13 nov. La del 5 nov no tiene grabación válida.
