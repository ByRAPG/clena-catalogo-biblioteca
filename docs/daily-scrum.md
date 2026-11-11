# Daily Scrum

## Propósito y reglas

Este informe reúne las actas del Daily Scrum del equipo de Backend de Consulta Fácil. Cada Daily se hace en Microsoft Teams, queda grabado y su enlace está en [`evidencias.md`](evidencias.md). Cada integrante responde tres preguntas: qué hizo, qué hará y qué lo bloquea. Las respuestas nombran los Issues y los Pull Requests concretos.

Reglas del equipo:

- Mínimo tres Daily por semana, de unos 15 minutos. El enunciado de la Entrega 1 admite como alternativa una Sprint Review semanal grabada.
- La fecha de cada acta coincide con la grabación, los Issues y los commits. Lo que no ha ocurrido se marca como **Previsto** y no lleva contenido.
- Los Issues #28 a #48 son las historias HU-01 a HU-21 (HU-n corresponde al Issue #(n + 27)). Los Issues #5 a #18 y #24 son los habilitadores T-01 a T-15 en orden; T-17 es el Issue #55. La lista completa está en [`backlog.md`](backlog.md).

## Resumen de la Entrega 1 (9 a 13 de noviembre de 2026)

| Fecha | Ceremonia | Estado | Hora |
|---|---|---|---|
| Lunes 9 de noviembre | Sprint Planning 1 y Daily Scrum 1 | Realizado | 6:57 p.m. (inicio de la grabación) |
| Martes 10 de noviembre | Review de avance con el Grupo 9 (no es Daily) | Realizada | 8:38 p.m. |
| Miércoles 11 de noviembre | Daily Scrum 2 | **Previsto** | 6:00 p.m. |
| Jueves 12 de noviembre | Daily Scrum 3 | **Previsto** | 6:00 p.m. |
| Viernes 13 de noviembre | Sprint Review 1 y Retrospectiva | **Previsto** | por confirmar |

Hasta el 10 de noviembre de 2026 solo se ha realizado el Daily Scrum 1. La Review de avance del martes 10 cuenta como evidencia adicional de la semana, pero no se presenta como Daily; su acta está en [`actas/2026-11-10-review-avance-g9.md`](actas/2026-11-10-review-avance-g9.md).

## Plantilla de acta

```markdown
### dd de mes de 2026 · Sprint n · Daily Scrum n
- Grabación: <enlace en evidencias.md>
- Asistentes: ...
- Ausentes: ...

| Integrante | Qué hice | Qué haré | Bloqueos |
|---|---|---|---|
| Nombre | #n, PR #m | #n | Ninguno |

Acuerdos: ...
```

## Registro de Daily Scrum

### 9 de noviembre de 2026 · Sprint 1 · Daily Scrum 1

- **Medio:** Microsoft Teams (canal General), **grabado**. La grabación empieza a las 6:57 p.m. (hora de Colombia) y dura unos 5 minutos. Enlace en [`evidencias.md`](evidencias.md), fila del 9 de noviembre.
- **Formato:** se hizo dentro del Sprint Planning 1, en una sola reunión. El Planning estaba previsto para el domingo 8 de noviembre y se reprogramó por falta de disponibilidad de los integrantes. Acta completa: [`actas/2026-11-09-sprint-planning-1.md`](actas/2026-11-09-sprint-planning-1.md).
- **Asistentes:** Rafael Potes (Scrum Master, modera), Humberto Llinás, Juan Camilo Fernández y Daniel Méndez.
- **Ausente:** Orlando Palma. No confirmó asistencia y todavía no tenía commits.

| Integrante | Qué hice | Qué haré (hasta el miércoles 11) | Bloqueos |
|---|---|---|---|
| Humberto Llinás | No lo indicó en la reunión | T-14 aviso de privacidad (#18), HU-12 importar CSV (#39), T-10 manual de usuario (#14), HU-20 préstamos y devoluciones (#47) | Ninguno |
| Juan Camilo Fernández | No lo indicó en la reunión | T-13 modelo de dominio (#17), HU-09 inicio de sesión (#36), HU-14 (#41), HU-16 (#43), HU-17 (#44), HU-18 (#45) | Ninguno por ahora |
| Daniel Méndez | No lo indicó en la reunión | T-06 modelo de datos (#10), T-17 semilla ficticia y plantilla CSV (#55), HU-06 (#33), HU-10 (#37), HU-11 (#38), HU-19 (#46), HU-21 (#48) | La invitación al repositorio sigue pendiente; la acepta ese mismo día desde el usuario `danimendeztv-source` |
| Rafael Potes | Actas, arquitectura C4 (T-08, #12), revisión con comentarios del Figma de Derek Pérez, asignaciones en Plane | HU-04 (#31), HU-05 (#32), HU-15 (#42) y el PR de documentación con la guía visual (#54) | Riesgo: Orlando Palma no confirmó asistencia ni tiene commits |
| Orlando Palma (ausente) | Sin participación en la reunión | Asignado: T-03 frontend base (#7) y HU-01, 02, 03, 07, 08, 13 (#28, #29, #30, #34, #35, #40) | No informado |

En la grabación, Humberto, Juan Camilo y Daniel no dijeron qué habían hecho; el acta lo deja así y no lo completa.

**Acuerdos del Daily 1**

| # | Acuerdo | Responsable | Fecha |
|---|---|---|---|
| 1 | Se aprueba el reparto del Sprint 1 (58 puntos) con el riesgo declarado: si algo no llega, se prioriza lo etiquetado `debe` | Equipo | 9 de noviembre |
| 2 | Datos ficticios mientras el CLENA no autorice datos reales por escrito (Issue #55) | Daniel Méndez | 11 de noviembre, 8:00 p.m. |
| 3 | Daniel acepta la invitación de GitHub desde `danimendeztv-source` | Daniel Méndez | 9 de noviembre |
| 4 | Rafael escribe a Orlando; si el miércoles 11 Orlando no tiene su PR, sus tareas se redistribuyen y se informa al docente | Rafael Potes | 9 y 11 de noviembre |
| 5 | Abrir el PR de documentación con la guía visual (Issue #54) | Rafael Potes | 10 de noviembre, 8:00 p.m. |

**Reglas de trabajo acordadas:** ramas `feat/<issue>-descripcion` desde `main` actualizado; PR con `Closes #n` y el `CLENA-n` correspondiente; pnpm, nunca npm; un compañero deja un Comment de revisión y solo Humberto o Rafael aprueban y fusionan; estados en Plane y en el Project al día, con Done solo con el PR fusionado.

**Rotación de revisiones:** Juan Camilo revisa a Daniel, Daniel a Orlando y Orlando a Juan Camilo.

### 11 de noviembre de 2026 · Sprint 1 · Daily Scrum 2

**Previsto.** Todavía no ocurre. Se mantiene en blanco hasta que se haga y se grabe.

- **Hora prevista:** 6:00 p.m., Microsoft Teams (acordado en el Sprint Planning 1).
- **Grabación:** pendiente. Se enlazará en [`evidencias.md`](evidencias.md).
- **Asistentes:** por registrar.
- **Punto de control ya acordado:** a las 8:00 p.m. del mismo día deben estar abiertos los PR del Sprint 1 con CI en verde.

| Integrante | Qué hice | Qué haré | Bloqueos |
|---|---|---|---|
| Humberto Llinás | Por registrar | Por registrar | Por registrar |
| Juan Camilo Fernández | Por registrar | Por registrar | Por registrar |
| Daniel Méndez | Por registrar | Por registrar | Por registrar |
| Rafael Potes | Por registrar | Por registrar | Por registrar |
| Orlando Palma | Por registrar | Por registrar | Por registrar |

### 12 de noviembre de 2026 · Sprint 1 · Daily Scrum 3

**Previsto.** Todavía no ocurre. Se mantiene en blanco hasta que se haga y se grabe.

- **Hora prevista:** 6:00 p.m., Microsoft Teams (acordado en el Sprint Planning 1).
- **Grabación:** pendiente. Se enlazará en [`evidencias.md`](evidencias.md).
- **Asistentes:** por registrar.
- **Punto de control ya acordado:** congelación a las 12:00 m. de ese día; lo que no esté completo no se muestra el viernes 13 y pasa al Sprint 2.

| Integrante | Qué hice | Qué haré | Bloqueos |
|---|---|---|---|
| Humberto Llinás | Por registrar | Por registrar | Por registrar |
| Juan Camilo Fernández | Por registrar | Por registrar | Por registrar |
| Daniel Méndez | Por registrar | Por registrar | Por registrar |
| Rafael Potes | Por registrar | Por registrar | Por registrar |
| Orlando Palma | Por registrar | Por registrar | Por registrar |

## Calendario previsto de los siguientes Daily

| Semana | Fechas previstas | Estado |
|---|---|---|
| Sprint 2 (14 al 19 de noviembre) | Lunes 16 y miércoles 18; el tercer día por acordar | Previsto |
| Sprint 3 (20 al 25 de noviembre) | Lunes 23; los demás días por acordar | Previsto |

Las fechas salen de [`plan-proyecto.md`](plan-proyecto.md). El docente puede cambiar la fecha de la entrega final; en ese caso se ajusta este calendario.
