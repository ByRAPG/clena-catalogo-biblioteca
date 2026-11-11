# Acta · Review de avance del Sprint 1 con el Grupo 9

- **Fecha:** martes 10 de noviembre de 2026, 8:38 p.m. (hora de Colombia); duración unos 5 minutos y medio
- **Medio:** Microsoft Teams (canal General), **grabada**. Enlace en [`evidencias.md`](../evidencias.md).
- **Asistentes de Backend:** Rafael Potes (Scrum Master, modera), Juan Camilo Fernández, Orlando Palma, Daniel Méndez
- **Asistentes del Grupo 9:** Shadia Castro, Emiliano Harvey (Product Owner del Grupo 9)
- **Ausentes:** Humberto Llinás (Product Owner de Backend) y Derek Pérez (Grupo 9)
- **Reprogramación:** la review estaba prevista para las 6:00 p.m. (acuerdo del kickoff del 7 de noviembre) y se hizo a las 8:38 p.m. del mismo día por disponibilidad de los asistentes. Se avisó por correo con copia al docente

## Resumen

Se revisó el avance del Sprint 1 (9 al 13 de noviembre, 15 historias, 58 puntos). En `main` están el entorno Docker, el CI, el esqueleto del backend y la arquitectura. **Todavía no hay pantallas funcionales** de búsqueda, inicio de sesión ni importación: se construyen entre el 10 y el 12 de noviembre y se muestran funcionando al Grupo 9 el viernes 13. El Grupo 9 aceptó seguir con datos ficticios y el orden de prioridad del sprint.

## Qué se mostró y qué no

| Punto | Estado |
|---|---|
| Entorno con `docker compose up`, `/api/v1/health` y `/docs` | **No se demostró en vivo**: Rafael no tenía el entorno abierto durante la reunión. Queda para la review del viernes 13 |
| Base del frontend (T-03, PR #59) | La presentó Orlando de palabra: letra base de 18 px, contraste WCAG AA, foco visible con teclado, rutas públicas y una ruta protegida, 14 pruebas. PR abierto el 10 de noviembre, en revisión |
| Búsqueda, detalle, inicio de sesión e importación CSV | No existen todavía |

## Avance por persona

| Persona | Lo que informó |
|---|---|
| Orlando Palma | Abrió el PR #59, que cierra T-03 (#7). Sobre esa base hace la búsqueda: HU-01, HU-02, HU-03 y HU-08 |
| Juan Camilo Fernández | Revisó el PR #56 y revisa el PR #59 de Orlando. Hace el inicio de sesión (HU-09, #36) y el modelo de dominio (T-13, #17). Abre su PR el miércoles 11 antes de las 8:00 p.m. |
| Daniel Méndez | Su invitación al repositorio seguía pendiente y se comprometió a aceptarla ese día con el usuario `danimendeztv-source`. Entrega el diagrama entidad-relación y la lista de libros ficticios del Issue #55, y sigue con HU-10 (#37) y HU-19 (#46) |
| Rafael Potes | Asume el esquema, la migración y la semilla del modelo de datos (T-06, #10) para no bloquear al equipo |
| Shadia Castro | El Grupo 9 intentó conseguir la información del CLENA y no se la entregaron. Está de acuerdo en seguir con datos ficticios. Si el CLENA responde, lo informa; no se sube nada sin autorización escrita |

## Datos y prototipo

- Se trabaja con unos 60 libros ficticios o de dominio público (Issue #55), sin datos reales ni logo del CLENA.
- Ajustes del prototipo de Figma para Derek Pérez (ausente), que Shadia y Emiliano le llevan antes de la entrega del Grupo 9 del miércoles 11:
  1. HU-12 (#39): que las filas válidas sí se importen.
  2. HU-10 (#37): mensaje «Libro registrado» y errores de campo vacío.
  3. HU-09 (#36): espera tras cinco intentos fallidos.
  4. HU-16 (#43): texto «Acepto el tratamiento de mis datos».

## Prioridad del Sprint 1

Rafael la leyó en nombre de Humberto Llinás, ausente. Se mantienen los 58 puntos con este orden:

1. Modelo de datos y semilla (T-06 #10, T-17 #55).
2. Flujo completo: buscar, ver ubicación y disponibilidad (HU-01, 02, 03, 06), iniciar sesión (HU-09), registrar libro y ejemplar (HU-10, 19) e importar el CSV (HU-12).
3. Accesibilidad, filtros, roles, registro de lector, QR y tutorial (HU-04, 08, 11, 18, 16, 05, 15).
4. Lo que no esté completo el jueves 12 a las 12:00 m. no se muestra el viernes y pasa al Sprint 2.

**Emiliano Harvey, Product Owner del Grupo 9, lo aceptó:** lo más importante para el usuario es buscar el libro, saber dónde está y si está disponible. Confirmó que el Grupo 9 ya validó las 21 historias y que actualiza su repositorio con esta review antes de su entrega.

## Feedback del Grupo 9

Rafael pidió que un integrante del Grupo 9 registrara su feedback como Issue con la plantilla `feedback-cliente` (sería el quinto; existen #50 a #53). **Durante la grabación no se dictó ni se creó el Issue**, y al redactar esta acta (10 de noviembre, 10:30 p.m.) no hay un Issue nuevo con esa etiqueta. Queda pendiente del Grupo 9.

## Acuerdos

| # | Acuerdo | Responsable | Fecha |
|---|---|---|---|
| 1 | Se mantienen los 58 puntos del Sprint 1 con el orden de prioridad leído | Equipo; lo ratifica Humberto Llinás por escrito en el PR de esta acta | 11 nov |
| 2 | Se sigue con datos ficticios (Issue #55) | Rafael Potes | 11 nov |
| 3 | Cuatro ajustes del Figma | Derek Pérez (se los llevan Shadia y Emiliano) | 11 nov |
| 4 | Registrar el quinto Issue `feedback-cliente` | Grupo 9 | 11 nov |
| 5 | PR del Sprint 1 abiertos con CI en verde | Cada integrante de Backend | 11 nov, 8:00 p.m. |
| 6 | Congelación | Equipo | 12 nov, 12:00 m. |
| 7 | Entrega 1 y demostración de las pantallas funcionando al Grupo 9 | Equipo | 13 nov, 9:00 a.m. |

## Seguimiento del mismo día (después de la grabación)

- Daniel Méndez aceptó la invitación al repositorio; se le asignaron sus historias (#33, #37, #38, #46, #48).
- Rafael abrió el PR #60 (en borrador) con el esquema, la migración y la semilla ficticia.
- Rafael dejó la revisión del PR #59.

## Notas de transcripción

La transcripción automática de Teams se normalizó al redactar el acta (por ejemplo, «Xadia» por Shadia, «Animendes TV» por `danimendeztv-source`, «wcg doble a» por WCAG AA). Juan Camilo dijo «tarea 3» al referirse al modelo de dominio, que es T-13. En el cierre se dijo «viernes 3» por viernes 13 y se leyó que el quinto feedback «quedó registrado», pero el Issue no se creó durante la reunión (ver «Feedback del Grupo 9»).
