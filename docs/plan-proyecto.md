# Plan del proyecto

> Responsable: Rafael Potes (Scrum Master · Tech Lead · Release Manager). Revisa: Humberto Llinás.
> Calendario comprimido **sujeto a confirmar con el docente** la fecha de entrega y sustentación de Backend.

## Herramientas

| Qué | Dónde | Para qué |
|---|---|---|
| Historias de usuario | GitHub Issues con etiqueta `historia-usuario` (autoría del Grupo 9) | Fuente oficial para el docente |
| Tablero | GitHub Projects: Backlog · To Do · In Progress · In Review · Done | Evidencia oficial |
| Sprints | GitHub Milestones = Cycles de Plane | Alcance por sprint |
| Planificación detallada | Plane, proyecto `CLENA` (workspace `clena-library`) | Descripciones completas, estimación, dependencias, módulos |
| Backlog legible | [`docs/backlog.md`](backlog.md) | Consulta rápida en el repo |
| Reuniones | Microsoft Teams, grabadas, compartidas con djromero@uninorte.edu.co | Evidencia de ceremonias |

Correspondencia: historia `HU-n` = work item `CLENA-n` en Plane (HU-01 = CLENA-1). Habilitadores `T-01…T-14` = `CLENA-22…35`.

## Calendario

| Fase | Fechas | Objetivo | Ceremonias |
|---|---|---|---|
| Inception | vie 6 – sáb 7 nov | Repo, arquitectura, backlog, esqueletos, CI | Reunión inicial con el G9 (6 nov). Kickoff con el G9 (sáb 7) |
| Sprint 1 | dom 8 – mar 10 nov | Un visitante busca un libro y ve dónde está; el personal inicia sesión y registra obras. Desplegado | Planning (dom 8). Daily (lun 9). Review + Retro (mar 10, noche) |
| Sprint 2 | mié 11 – mar 17 nov | Búsqueda tolerante y filtros, ejemplares, CSV, préstamos, QR, lectura fácil, cuenta de lector | Planning (mié 11). Daily (vie 13, lun 16). Review + Retro (mar 17) |
| Sprint 3 | mié 18 – lun 23 nov | Alertas, tutorial, asistente sin IA, llamar a un trabajador, cita, analítica, manuales, cobertura | Planning (mié 18). Daily (vie 20). Review + Retro (lun 23) |
| Cierre | mar 24 – mié 25 nov | Congelamiento, ensayo de sustentación, release `v1.0.0`, entrega | Ensayo (mar 24) |

Fechas del Grupo 9: Entrega 1 el 11 nov y entrega final el 25 nov.

## Alcance por sprint

| Sprint | Historias | Habilitadores | Puntos |
|---|---|---|---|
| Inception | — | T-01, T-02, T-03, T-04, T-05, T-06, T-08 | — |
| Sprint 1 | HU-01, HU-02, HU-05, HU-06 | T-07, T-14 | 24 |
| Sprint 2 | HU-03, HU-04, HU-07, HU-08, HU-09, HU-11, HU-13, HU-14 | T-09 | 39 |
| Sprint 3 | HU-10, HU-12, HU-15, HU-16, HU-17, HU-18, HU-20 | T-10, T-11, T-13 | 30 |
| Si hay capacidad | HU-19 (mapa) | — | 8 |

## Responsables

| Integrante | Rol | Módulos | Revisor par |
|---|---|---|---|
| Rafael Potes | Scrum Master · Tech Lead · Release Manager | Fundaciones, CI/CD, Docker, despliegue, QR, tutorial, lectura fácil, actas, manual de operación | Rotación |
| Humberto Llinás | Product Owner · revisor de arquitectura y plan | Préstamos y alertas, manual de usuario, aviso de privacidad | Orlando Palma |
| Juan Camilo | Development Team | Identidad y acceso, asistente de ayuda, Swagger | Daniel Méndez |
| Daniel Méndez | Development Team | Catálogo, CSV, modelo de datos, mapa | Juan Camilo |
| Orlando Palma | Development Team | Búsqueda, cita, analítica, esqueleto frontend | Humberto Llinás |

Regla del docente: cada integrante necesita commits, PRs y revisiones en al menos 2 sprints. La rotación lo garantiza.

## Rol del Grupo 9

- Redacta y registra las historias de usuario como Issues (`historia-usuario`), al menos 3 por integrante. Backend entrega un borrador en [`backlog.md`](backlog.md) para que lo ajusten.
- Prioriza con el Product Owner (Shadia Castro ↔ Humberto Llinás).
- Participa en las Sprint Reviews y crea al menos 5 Issues `feedback-cliente` durante el proyecto.
- Consigue información del CLENA (plano, ejemplo de inventario) cuando se necesite.

## Comunicación

- Grupo de WhatsApp para coordinación diaria; Teams para ceremonias grabadas.
- Todo correo con el Grupo 9 lleva copia a djromero@uninorte.edu.co.
- Cada ceremonia tiene acta en [`actas/`](actas) el mismo día, con enlace a la grabación en [`evidencias.md`](evidencias.md). Las actas nombran los Issues y PRs tratados.

## Riesgos

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Calendario muy corto | Alta | Alto | Alcance «Debe» primero; HU-19 solo si sobra capacidad; trabajo en paralelo por módulos |
| Fecha de entrega de Backend no confirmada | Media | Alto | Preguntar al docente por correo el 6 nov |
| Integrantes sin experiencia en Clean Architecture | Media | Medio | Primer módulo de ejemplo de punta a punta (T-02); revisión par obligatoria |
| El G9 no registra las historias a tiempo | Media | Alto | Borrador listo; sesión guiada en el kickoff; plantilla de Issue |
| La capa gratuita del despliegue se duerme o cambia | Media | Medio | Despertar el servicio antes de cada review; Docker local como respaldo |
| Falta de datos reales del CLENA | Alta | Bajo | Semillas ficticias realistas; importación CSV para cuando haya datos |
| Grabaciones faltantes | Media | Alto | Grabar desde el inicio de cada reunión; checklist en cada acta |
