# Acta · Sprint Planning 1 y Daily Scrum 1 (Backend)

- **Fecha:** lunes 9 de noviembre de 2026, noche (la grabación empieza a las 6:57 p.m. hora de Colombia; el nombre del archivo de Teams, `20261109_235728`, está en UTC); duración unos 5 minutos
- **Medio:** Microsoft Teams (canal General), **grabada**. Enlace en [`evidencias.md`](../evidencias.md).
- **Asistentes:** Rafael Potes (Scrum Master, modera), Humberto Llinás, Juan Camilo Fernández, Daniel Méndez
- **Ausente:** Orlando Palma
- **Reprogramación:** el Sprint Planning estaba previsto para el domingo 8 de noviembre y no se pudo hacer por falta de disponibilidad de los integrantes. Se hizo hoy, junto con el primer Daily Scrum, en una sola reunión.

## Resumen

Se fijó el alcance del Sprint 1 (9 al 13 de noviembre): el 80 % obligatorio de punta a punta, 58 puntos. Se declaró el riesgo de que sea mucho para cinco días; si algo no llega, se prioriza lo etiquetado `debe`. El CLENA no entregó datos (rechazó la solicitud hecha a los compañeros de Introducción; Shadia intentó comunicarse), por lo que se trabaja con datos ficticios (Issue #55). El 70 % de cobertura de pruebas corresponde a los Sprints 2 y 3. Las 21 historias de usuario están como Issues #28 a #48 y el Grupo 9 las validó («Aprobado por el grupo 9») y comentó.

## Sprint Planning 1: reparto y primeras ramas

| Responsable | Tareas e historias | Primera rama | Compromiso |
|---|---|---|---|
| Humberto Llinás | T-14 (aviso de privacidad), HU-12 (importar CSV), T-10, HU-20 | `feat/39-importar-csv` | PR el miércoles antes de las 8 p.m. |
| Juan Camilo Fernández | T-13 (modelo de dominio), HU-09 (inicio de sesión), HU-14, 16, 17, 18 | `feat/36-login` | PR el miércoles antes de las 8 p.m. y Comment de revisión en el PR de Daniel |
| Daniel Méndez | T-06 (modelo de datos, diagrama en draw.io, migraciones, semilla), T-17 (semilla ficticia y plantilla CSV, Issue #55), HU-06, 10, 11, 19, 21 | `feat/10-modelo-datos` | PR el miércoles antes de las 8 p.m. y Comment de revisión en el PR de Orlando |
| Rafael Potes | HU-04, HU-05, HU-15 y el PR de documentación con la guía visual (Issue #54) | por abrir | PR de documentación el martes 10 antes de las 8 p.m.; PR de historias el miércoles |
| Orlando Palma (ausente) | T-03 (frontend base), HU-01, 02, 03, 07, 08, 13 | por definir | Ver «Contingencia» |

Aclaración sobre las asignaciones de la grabación: Humberto cita T-10 y HU-20, y Juan Camilo cita HU-14, 16, 17 y 18; coinciden con el reparto registrado en Plane y GitHub. HU-07, 13, 14, 17, 20, 21 y T-10 son asignaciones anticipadas: no pertenecen al Sprint 1, sino a los Sprints 2 y 3, como indica `backlog.md`.

## Daily Scrum 1

| Persona | Qué hizo | Qué hará hasta el miércoles | Bloqueo |
|---|---|---|---|
| Humberto | No lo indicó en la reunión | T-14, HU-12, T-10, HU-20 | Ninguno |
| Juan Camilo | No lo indicó en la reunión | T-13, HU-09 (login), HU-14, 16, 17, 18 | Ninguno por ahora |
| Daniel | No lo indicó en la reunión | T-06, T-17, HU-06, 10, 11, 19, 21 | La invitación al repositorio sigue pendiente; la acepta hoy mismo desde el usuario `danimendeztv-source` |
| Rafael | Actas, arquitectura C4, revisión del Figma de Derek con comentarios, asignaciones en Plane | HU-04, HU-05, HU-15 y PR de documentación | Riesgo: Orlando no confirmó asistencia ni tiene commits |

## Reglas acordadas

- Cada rama sale de `main` actualizado con el nombre `feat/<issue>-descripcion`.
- El PR lleva `Closes #n` y el `CLENA-n` correspondiente.
- Se usa pnpm, nunca npm (así se dijo en clase).
- Un compañero deja un Comment de revisión; aprueban y fusionan solo Humberto o Rafael.
- Rotación de revisiones: Juan Camilo revisa a Daniel, Daniel a Orlando y Orlando a Juan Camilo.
- Los estados en Plane y en el Project se mueven al día; Done solo con el PR fusionado.
- Cada integrante necesita un commit, un PR propio y una revisión de un PR ajeno.

## Fechas

| Fecha | Hito |
|---|---|
| Mar 10 nov, 6:00 p.m. | Review de avance con el Grupo 9 |
| Mar 10 nov, 8:00 p.m. | PR de documentación (Issue #54) con la guía visual |
| Mié 11 nov, 6:00 p.m. | Daily Scrum 2 |
| Mié 11 nov, 8:00 p.m. | PR del Sprint 1 abiertos con CI en verde |
| Jue 12 nov, 12:00 m. | Congelación |
| Jue 12 nov, 6:00 p.m. | Daily Scrum 3 |
| Vie 13 nov, 9:00 a.m. | Entrega 1 |

## Acuerdos

| # | Acuerdo | Responsable | Fecha |
|---|---|---|---|
| 1 | Se aprueba el reparto de la tabla anterior y los 58 puntos del Sprint 1, con el riesgo declarado | Equipo | 9 nov |
| 2 | Se usan datos ficticios mientras el CLENA no autorice datos reales por escrito (Issue #55) | Daniel Méndez | 11 nov, 8:00 p.m. |
| 3 | Daniel acepta la invitación de GitHub desde `danimendeztv-source` | Daniel Méndez | 9 nov |
| 4 | Rafael escribe a Orlando el 9 nov | Rafael Potes | 9 nov |
| 5 | Abrir el PR de documentación con la guía visual | Rafael Potes | 10 nov, 8:00 p.m. |

## Contingencia por la ausencia de Orlando

Rafael le escribe hoy. Si el miércoles 11 no tiene su PR, sus tareas se redistribuyen entre el equipo y se informa al profesor.

## Notas de transcripción

La transcripción automática de Teams se normalizó al redactar el acta (por ejemplo, «fit» por `feat`, «CUSV» por CSV, «PNPM», «C cuatro» por C4, «plain» por Plane y «Clea» por CLENA). Al final de la reunión, Rafael dijo que el acta sale de la grabación.
