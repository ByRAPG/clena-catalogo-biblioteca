# Sprint Planning

Una sección por sprint. Se completa el día del Planning, con la grabación enlazada en [`evidencias.md`](evidencias.md).

## Sprint 1 · 9 – 13 nov 2026

- **Fecha y hora:** lun 9 nov 2026, 6:57 p.m. (hora de Colombia; la grabación de Teams lleva la hora en UTC, 23:57), Teams, unos 5 minutos (reprogramado: el dom 8 nov no se hizo por falta de disponibilidad de los integrantes)
- **Asistentes:** Rafael Potes, Humberto Llinás, Juan Camilo Fernández, Daniel Méndez. Ausente: Orlando Palma
- **Grabación:** en [`evidencias.md`](evidencias.md). Acta: [`actas/2026-11-09-sprint-planning-1.md`](actas/2026-11-09-sprint-planning-1.md)
- **Objetivo del sprint:** el 80 % del alcance mínimo de punta a punta, para la Entrega 1 del vie 13 nov (9:00 am): catálogo con CSV, búsqueda tolerante con filtros, ubicación y disponibilidad, QR y tutorial, login JWT, tres roles y aviso de privacidad.
- **Capacidad:** 58 pts

| Issue | Historia / tarea | Pts | Responsable |
|---|---|---|---|
| #28 | HU-01 Buscar por parte del título | 5 | Orlando Palma |
| #29 | HU-02 Buscar por autor o tema | 3 | Orlando Palma |
| #30 | HU-03 Ver la ubicación del libro | 2 | Orlando Palma |
| #35 | HU-08 Filtrar por categoría o sala | 3 | Orlando Palma |
| #31 | HU-04 Interfaz legible para adultos mayores | 3 | Rafael Potes |
| #32 | HU-05 Abrir el catálogo con QR | 2 | Rafael Potes |
| #42 | HU-15 Tutorial guiado | 5 | Rafael Potes |
| #33 | HU-06 Ver la disponibilidad | 3 | Daniel Méndez |
| #37 | HU-10 Registrar un libro nuevo | 5 | Daniel Méndez |
| #38 | HU-11 Editar ubicación y estado | 3 | Daniel Méndez |
| #46 | HU-19 Registrar ejemplares | 3 | Daniel Méndez |
| #36 | HU-09 Iniciar sesión como bibliotecario | 5 | Juan Camilo Fernández |
| #43 | HU-16 Crear cuenta de lector con aviso | 5 | Juan Camilo Fernández |
| #45 | HU-18 Cuentas del personal y roles | 3 | Juan Camilo Fernández |
| #39 | HU-12 Importar el catálogo desde CSV | 8 | Humberto Llinás |
| #_ | T-06, T-08, T-13, T-14, T-12 | — | Daniel, Rafael, Juan Camilo, Humberto |

**Acuerdos:** ver el [acta](actas/2026-11-09-sprint-planning-1.md). Riesgo declarado: 58 puntos en cinco días; si algo no llega se prioriza lo clasificado como Debe.

## Sprint 2 · 14 – 19 nov 2026

- **Fecha y hora:** no hubo reunión de Planning 2. El plan se hizo **por escrito el 15 nov 2026** (Issues #86 a #107 creados con responsable, milestone, Project y Plane). La constancia se dijo en la grabación del 19 nov y está en el [acta del Planning 3](actas/2026-11-19-sprint-planning-3.md)
- **Objetivo del sprint:** que la aplicación se vea como el CLENA, sea segura y entienda lo que el lector busca
- **Capacidad:** 60 pts. Por persona: Rafael 25, Humberto 9, Juan Camilo 13, Orlando 10, Daniel 3

| Issue | Historia / tarea | Pts | Responsable |
|---|---|---|---|
| #16 | T-12 Documentación de cierre | 3 | Rafael Potes |
| #86, #58 | T-20 imagen pgvector; T-19 (1/2) imagen de producción | 1 + 3 | Rafael Potes |
| #87, #88 | T-21 tema de marca; T-22 cabecera, pie y logos | 3 + 3 | Rafael Potes |
| #57 | T-18 seguridad (cabeceras, límite, Dependabot, CodeQL) | 3 + 1 | Rafael Potes |
| #89 a #92 | T-23 ADR-08; T-24 pgvector; T-25 puerto de embeddings; T-26 reindexado | 1 + 2 + 2 + 3 | Rafael Potes |
| #18, #101, #102 | T-14 aviso de privacidad; T-35 importación idempotente; T-36 codificación y límites | 1 + 3 + 5 | Humberto Llinás |
| #93, #45, #94, #43 | T-27 login seguro; HU-18 cuentas del personal; T-28 e2e de autenticación; HU-16 cuenta de lector | 2 + 3 + 3 + 5 | Juan Camilo Fernández |
| #95, #96, #34 | T-29 portada; T-30 tarjetas y detalle; HU-07 sin resultados | 3 + 5 + 2 | Orlando Palma |
| #38 | HU-11 Editar ubicación y estado | 3 | Daniel Méndez |

**Resultado al cierre (19 nov):** ninguna tarea en Hecho (Hecho = pull request fusionado). Rafael tiene 15 pull requests abiertos sin revisión; los demás integrantes no tenían pull request. Ver el [acta de la Review 2](actas/2026-11-19-sprint-review-2.md) y el [acta de la retrospectiva](actas/2026-11-19-sprint-retrospective-2.md).

## Sprint 3 · 20 – 25 nov 2026

- **Fecha y hora:** jue 19 nov 2026, 9:27 p.m. (hora de Colombia), Teams, en una sola sesión con la Review 2 y la retrospectiva (unos 8 minutos en total)
- **Asistentes:** Rafael Potes, Humberto Llinás, Juan Camilo Fernández, Daniel Méndez. Ausente: Orlando Palma
- **Grabación:** en [`evidencias.md`](evidencias.md). Acta: [`actas/2026-11-19-sprint-planning-3.md`](actas/2026-11-19-sprint-planning-3.md)
- **Objetivo del sprint:** dejar el producto listo para producción. Entrega final: mié 25 nov 2026
- **Capacidad:** 72 pts del Sprint 3 más unos 38 pts arrastrados del Sprint 2

| Issue | Historia / tarea | Pts | Responsable |
|---|---|---|---|
| #101, #102, #18 | T-35, T-36 y T-14 (arrastradas) | 3 + 5 + 1 | Humberto Llinás |
| #103, #47, #14 | T-37 simulación de importación; HU-20 préstamos y devoluciones; T-10 manual de usuario | 5 + 8 + 2 | Humberto Llinás |
| #93, #45, #94, #43 | T-27, HU-18, T-28 y HU-16 (arrastradas) | 2 + 3 + 3 + 5 | Juan Camilo Fernández |
| #44, #41 | HU-17 eliminar mi cuenta; HU-14 reservas | 3 + 5 | Juan Camilo Fernández |
| #38 | HU-11 (arrastrada) | 3 | Daniel Méndez |
| #46, #48, #100 | HU-19 ejemplares; HU-21 alertas; consultas de evaluación de la búsqueda (T-34) | 3 + 5 | Daniel Méndez |
| #95, #96, #34 | T-29, T-30 y HU-07 (arrastradas) | 3 + 5 + 2 | Orlando Palma (ausente) |
| #99, #40, #106 | T-33 indicador de modo; HU-13 búsqueda por voz; T-40 pulido de pantallas | 1 + 3 + 3 | Orlando Palma (ausente) |
| #16, #100, #105, #11, #15, #107 | T-12, T-34, T-39, T-07, T-11 y T-41; fusionar los 15 pull requests abiertos | 3 + 3 + 5 + 3 + 2 + 1 | Rafael Potes |

**Orden de sacrificio:** HU-13, HU-21, HU-14, HU-17, T-40. No se sacrifica la búsqueda semántica ni el formato de importación.
**Acuerdos:** ver el [acta](actas/2026-11-19-sprint-planning-3.md). Riesgos: alcance, revisiones atrasadas, falta de autorización de los logos y de una muestra real, y el servidor de 2 GB del despliegue sin decidir.
