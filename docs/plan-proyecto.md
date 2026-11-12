# Plan del proyecto · Consulta Fácil

> Responsable: Rafael Potes Molina (Scrum Master · Tech Lead · Release Manager). Revisa: Humberto Llinás Marimón.
> Versión 2 (6 nov 2026): ajustada a la «Entrega 1» de Backend publicada por el docente (cierre **viernes 13 nov, 9:00 am**, con el 80 % del alcance mínimo funcionando).

## Herramientas

| Qué | Dónde | Para qué |
|---|---|---|
| Historias de usuario | GitHub Issues con etiqueta `historia-usuario` (autoría del Grupo 9) | Fuente oficial para el docente |
| Tablero | GitHub Projects: Backlog · To Do · In Progress · In Review · Done | Evidencia oficial. Una tarjeta pasa a Done solo con su PR fusionado |
| Sprints | GitHub Milestones = Cycles de Plane | Alcance y objetivo de cada sprint |
| Planificación detallada | Plane, proyecto `CLENA` (workspace `clena-library`) | Descripciones, estimación, dependencias, módulos |
| Backlog legible | [`docs/backlog.md`](backlog.md) | Consulta rápida en el repo |
| Informes | `docs/*.md` → PDF con [`docs/pdf/`](pdf/README.md); diagramas en draw.io (`docs/diagramas/`) | El docente solo califica PDF con diagramas como imagen |
| Reuniones | Microsoft Teams, grabadas, compartidas con djromero@uninorte.edu.co | Evidencia de ceremonias |

Correspondencia: historia `HU-n` = work item `CLENA-n` en Plane. Habilitadores `T-01…T-19` = `CLENA-22…40`.

## Fechas que manda el docente

| Fecha | Qué | Quién |
|---|---|---|
| mié 11 nov | Entrega 1 del Grupo 9: historias en **nuestro** repo, Figma, ≥ 2 reuniones grabadas con nosotros, 1 Sprint Review, ≥ 5 Issues `feedback-cliente` | Grupo 9 |
| **vie 13 nov, 9:00 am** | **Entrega 1 de Backend**: tag `entrega-1`, informes PDF, base técnica y 80 % funcional | Backend |
| clase siguiente al 13 | Presentación de 10 min (cada integrante explica lo que subió) | Backend |
| mié 25 nov | Entrega final (alcance completo, despliegue, manuales, acta de aceptación del G9) | Ambos |

## Calendario

| Sprint | Fechas | Objetivo | Ceremonias (Teams, grabadas) |
|---|---|---|---|
| **Sprint 0 · Inception** | vie 6 – dom 8 nov | Backlog validado por el G9, base técnica (`docker compose up` con `/health` y `/docs`), CI, borradores de dominio, datos y arquitectura | Reunión inicial (mar 3) · **Kickoff con el G9** (sáb 7) · Planning S1 (dom 8) |
| **Sprint 1** | lun 9 – vie 13 nov | **80 % del alcance mínimo de punta a punta**: catálogo y CSV, búsqueda tolerante con filtros, ubicación y disponibilidad, QR y tutorial, login JWT, 3 roles, aviso de privacidad. Informes PDF. Tag `entrega-1` | Daily (lun 9) · **Review de avance con el G9 (mar 10)** · Daily (mié 11) · Daily (jue 12) _(las dailies del 11 y 12 se cancelaron el 11 nov; seguimiento por escrito)_ · Review + Retro S1 (vie 13, tarde) |
| **Sprint 2** | sáb 14 – jue 19 nov | Préstamos y alertas, reserva, eliminar cuenta, mensaje sin resultados, pruebas e2e | Planning (sáb 14) · Daily (lun 16, mié 18) · Review + Retro con el G9 (jue 19) |
| **Sprint 3** | vie 20 – mié 25 nov | Pulir, cobertura ≥ 70 %, búsqueda por voz si hay capacidad, manuales, release `v1.0.0`, acta de aceptación | Planning (vie 20) · Daily (lun 23) · Review final + Retro (mar 24) · Entrega (mié 25) |

Mínimo 3 dailies por semana (lun, mié y un tercer día). Cada acta nombra Issues y PRs concretos y tiene la misma fecha que la grabación.

**¿Por qué la Review del martes 10?** El G9 necesita asistir a una Sprint Review y probar un incremento antes de su entrega del 11 nov. El martes mostramos lo que ya funcione (búsqueda y detalle con datos semilla) y ellos registran sus primeros Issues `feedback-cliente`.

## Alcance por sprint

| Sprint | Historias | Habilitadores | Puntos |
|---|---|---|---|
| Sprint 0 | — | T-01, T-02, T-03, T-04, T-05; borradores de T-06, T-08, T-13 | — |
| Sprint 1 | HU-01, 02, 03, 04, 05, 06, 08, 09, 10, 11, 12, 15, 16, 18, 19 | T-06, T-08, T-12, T-13, T-14, T-15, T-16, T-17 | 58 |
| Sprint 2 | HU-07, 14, 17, 20, 21 | T-09, T-18 | 23 |
| Sprint 3 | HU-13 (si hay capacidad) | T-07 y T-19 (despliegue), T-09, T-10, T-11 | 3 |

El Sprint 1 es grande porque el docente exige el 80 % al 13 nov. Por eso las historias se reparten para que los cinco trabajen en paralelo desde el lunes 9 y el esqueleto (Sprint 0) debe quedar listo el domingo 8.

## Responsables

| Integrante | Rol | Sprint 1 | Después | Comenta sus PRs |
|---|---|---|---|---|
| Rafael Potes Molina | Scrum Master · Tech Lead · Release Manager · aprobador principal | T-02 esqueleto backend, T-05 CI, HU-04, HU-05, HU-15, T-08 arquitectura, actas | T-07 despliegue, T-11 manual de operación | Quien tenga menos revisiones esa semana |
| Humberto Llinás Marimón | Product Owner · revisor de arquitectura y plan · aprobador alterno | **T-04 infraestructura Docker**, HU-12 importación CSV, T-14 aviso de privacidad | HU-20 préstamos, T-10 manual de usuario | Quien tenga menos revisiones esa semana |
| Juan Camilo Fernández Barrios | Development Team | HU-09 login, HU-16 registro con consentimiento, HU-18 roles, T-13 modelo de dominio | HU-14 reserva, HU-17 eliminar cuenta | Daniel Méndez |
| Daniel Méndez Aparicio | Development Team | T-06 diagrama entidad-relación y `modelo-datos.pdf` (el esquema, la migración y la semilla los asumió Rafael Potes el 10 nov), HU-06, HU-10, HU-11, HU-19 | HU-21 alertas | Orlando Palma |
| Orlando Palma | Development Team | T-03 esqueleto frontend, HU-01, HU-02, HU-03, HU-08 | HU-07, HU-13 | Juan Camilo Fernández |

Solo Rafael Potes (principal) o Humberto Llinás (alterno) aprueban y fusionan. Antes, un compañero deja una revisión de tipo **Comment**. Así cada integrante tiene en cada entrega **un commit, un PR propio y una revisión de un PR ajeno**, que el docente exige (sin eso, la nota individual baja hasta 90 %).

### Orden del Sprint 0 (para que nadie quede bloqueado)

1. **Sáb 7:** Rafael sube T-02 (NestJS con las 4 capas, `/api/v1/health`, `/docs`, Prisma) y Orlando T-03 (React + Vite + Mantine). Cada uno con su PR.
2. **Sáb 7 – dom 8:** Humberto hace T-04 sobre esos esqueletos: Dockerfile de backend y frontend y `docker-compose.yml` con PostgreSQL 16, para que `docker compose up` levante todo sin pasos manuales. Si los esqueletos se atrasan, empieza con PostgreSQL y agrega los servicios al fusionarse T-02 y T-03.
3. **Dom 8:** Rafael T-05 (GitHub Actions). Daniel primera migración (T-06). Juan Camilo borrador del modelo de dominio (T-13).
4. **Dom 8, noche:** Sprint Planning 1 con las historias registradas por el G9.

## Rol del Grupo 9

- Registra **sus** historias como Issues en este repositorio (≥ 3 por integrante), con el texto de [`backlog.md`](backlog.md), y comenta «Validada por el Grupo 9» en cada una.
- Prioriza con el Product Owner (Emiliano Harvey ↔ Humberto Llinás).
- Asiste a la Review del mar 10 y a las Sprint Reviews; registra ≥ 5 Issues `feedback-cliente`.
- Diseña el prototipo en Figma (≥ 8 pantallas, nombres «HU-xx …») y lo comparte con Backend y el docente.
- Consigue la información del CLENA de la lista de solicitudes (catálogo, clasificación, salas, préstamos, autorizaciones).
- Firma (o valida por comentario) el acta de Inception.

## Comunicación

- Grupo de WhatsApp para coordinación diaria; Teams para ceremonias grabadas.
- Todo correo con el Grupo 9 lleva copia a djromero@uninorte.edu.co.
- Cada ceremonia tiene acta en [`actas/`](actas) el mismo día, con enlace a la grabación en [`evidencias.md`](evidencias.md).

## Riesgos

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| 80 % funcional al 13 nov con un sprint de 5 días | Alta | Alto | Esqueleto listo el dom 8; historias en paralelo por módulo; lo que no llegue se demuestra completo o no se muestra (una funcionalidad a medias no suma) |
| El G9 no registra las historias a tiempo | Media | Alto | Enlaces prellenados; registro en vivo durante el kickoff |
| Esqueletos atrasados bloquean a todos | Media | Alto | T-02, T-03 y T-04 el sábado; Rafael desbloquea |
| Informes en formato incorrecto (Markdown o Mermaid) | Media | Alto | Herramienta `docs/pdf/`, diagramas solo en draw.io |
| Actas con fechas incoherentes | Media | Alto (Scrum = 0) | Acta el mismo día de la grabación; nombrar Issues y PRs |
| Integrantes sin commit, PR o revisión | Media | Alto | Tabla de responsables y rotación de revisión |
| Datos reales del CLENA sin autorización | Baja | Alto (−20 pts) | Solo semillas ficticias; datos reales solo con autorización escrita y fuera del repo público |
| La capa gratuita del despliegue se duerme | Media | Medio | Despertar el servicio antes de cada review; Docker local como respaldo |
