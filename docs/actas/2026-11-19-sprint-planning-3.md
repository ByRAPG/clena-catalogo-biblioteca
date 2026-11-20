# Acta · Sprint Planning 3 (Backend)

- **Fecha:** jueves 19 de noviembre de 2026, minutos 5:30 a 8:10 de la grabación, que empezó a las 4:27 p.m. hora de Colombia (21:27 UTC) y terminó a las 4:35 p.m. (21:35 UTC); duración de esta parte, unos 2 minutos y medio
- **Medio:** Microsoft Teams (canal General), **grabada**, misma sesión que la [Sprint Review 2](2026-11-19-sprint-review-2.md) y la [retrospectiva](2026-11-19-sprint-retrospective-2.md). Grabación: [Teams/SharePoint](https://uninorte.sharepoint.com/sites/CLENA-IntroxBackend/Documentos%20compartidos/General/Recordings/Meeting%20in%20General-20261119_212731-Meeting%20Recording.mp4?web=1) (también en [`evidencias.md`](../evidencias.md))
- **Asistentes:** Rafael Potes (Scrum Master, modera y es secretario), Humberto Llinás, Juan Camilo Fernández, Daniel Méndez
- **Ausente:** Orlando Palma. Rafael leyó sus tareas en tercera persona y le escribe ese día para que las confirme por escrito en sus Issues
- **Constancia:** el Sprint 2 no tuvo Planning 2; esta sesión planea solo el Sprint 3.

## Objetivo y alcance

- **Sprint 3:** del 20 al 25 de noviembre de 2026; el **25 de noviembre es la entrega final**.
- **Objetivo:** dejar el producto listo para producción.
- **Alcance:** **72 puntos** más unos **38 puntos** que quedaron del Sprint 2 (tareas sin pull request de los demás integrantes y T-12 de Rafael). Es más del doble de lo cerrado en el Sprint 1 (132 puntos en dos sprints).
- **Orden de sacrificio** si no alcanza: 1) búsqueda por voz (HU-13); 2) alertas (HU-21); 3) reservas (HU-14); 4) eliminar la cuenta (HU-17); 5) pulido de animaciones (T-40). **No se sacrifica** lo que pidió el profesor: la búsqueda semántica y el formato de importación.
- **Nadie pierde hoy ninguna tarea.** Quien no pueda cumplir una la avisa por escrito en el Issue y entre todos se decide quién la toma.

## Reparto

Las tareas e Issues son los dictados por Rafael. Los puntos son los del backlog (`docs/backlog.md` y los Issues), no se dictaron en la reunión. «S2» = arrastrada del Sprint 2.

| Responsable | Tareas e historias | Pts |
|---|---|---|
| Humberto Llinás | T-35 (#101, CLENA-57, S2); T-36 (#102, CLENA-58, S2); T-14 (#18, CLENA-35, S2); T-37 (#103, CLENA-59); HU-20 (#47, CLENA-20); T-10 (#14, CLENA-31). Aprueba los pull requests de Rafael | 3 + 5 + 1 + 5 + 8 + 2 = 24 |
| Juan Camilo Fernández | T-27 (#93, CLENA-49, S2); HU-18 (#45, CLENA-18, S2); T-28 (#94, CLENA-50, S2); HU-16 (#43, CLENA-16, S2); HU-17 (#44, CLENA-17); HU-14 (#41, CLENA-14). Revisa los pull requests de Daniel | 2 + 3 + 3 + 5 + 3 + 5 = 21 |
| Daniel Méndez | HU-11 (#38, CLENA-11, S2); HU-19 (#46, CLENA-19); HU-21 (#48, CLENA-21); las consultas de evaluación de la búsqueda (T-34, #100, CLENA-56). Revisa los pull requests de Orlando | 3 + 3 + 5 = 11 |
| Orlando Palma (ausente) | T-29 (#95, CLENA-51, S2); T-30 (#96, CLENA-52, S2); HU-07 (#34, CLENA-7, S2); T-33 (#99, CLENA-55); HU-13 (#40, CLENA-13); T-40 (#106, CLENA-62). Revisa los pull requests de Juan Camilo | 3 + 5 + 2 + 1 + 3 + 3 = 17 |
| Rafael Potes | Fusionar en orden los 15 pull requests abiertos cuando lleguen las revisiones. Tareas pendientes: T-12 (#16, CLENA-33, S2), T-34 (#100, CLENA-56), T-39 (#105, CLENA-61), T-07 (#11, CLENA-28), T-11 (#15, CLENA-32) y T-41 (#107, CLENA-63) | 3 + 3 + 5 + 3 + 2 + 1 = 17 |

Los 38 puntos arrastrados son: Humberto 9 (T-35, T-36, T-14), Juan Camilo 13 (T-27, HU-18, T-28, HU-16), Orlando 10 (T-29, T-30, HU-07), Daniel 3 (HU-11) y Rafael 3 (T-12). Los pull requests de Rafael que ya están abiertos (T-18 a T-26, T-19, T-31, T-32, T-38, T-09 y T-42) no se repasaron uno por uno.

## Reglas

- Un Issue, una rama, un pull request con `Closes #n` y el identificador de Plane.
- Un compañero revisa por rotación (Juan Camilo a Daniel, Daniel a Orlando, Orlando a Juan Camilo); **aprueban solo Humberto o Rafael**. En lo dicho: «aprueban solo Humberto o yo».
- Pull request en borrador desde el primer día y bloqueos por escrito en el Issue el mismo día (acuerdos de la [retrospectiva](2026-11-19-sprint-retrospective-2.md)).
- **No se hace Daily**: el seguimiento es por escrito. Las actas salen de la grabación.

## Riesgos declarados

El alcance; las revisiones atrasadas; la falta de autorización de los logos y de una muestra real del catálogo del CLENA; y el servidor de 2 GB del despliegue, sin decidir. En la grabación no se repitió el riesgo de que la búsqueda semántica aporte poco por falta de resumen de las obras, aunque se mencionó como límite en la Review.

## Fecha de la entrega

Entrega final: **miércoles 25 de noviembre de 2026**. En la grabación no se dijo la hora, ni dónde se despliega (decisión pendiente por escrito).

## Acuerdos

| # | Acuerdo | Responsable | Fecha |
|---|---|---|---|
| 1 | Se aprueba el alcance del Sprint 3 (72 puntos más el arrastre de unos 38 del Sprint 2) con el orden de sacrificio leído | Equipo | 19 nov |
| 2 | Se mantiene el reparto de la tabla anterior; nadie pierde tareas | Equipo | 19 nov |
| 3 | Humberto aprueba los pull requests de Rafael; Rafael los fusiona en orden cuando lleguen las revisiones | Humberto Llinás, Rafael Potes | Durante el sprint |
| 4 | Rafael escribe a Orlando para que confirme por escrito sus tareas | Rafael Potes | 19 nov |
| 5 | Entrega final el 25 de noviembre | Equipo | 25 nov |

## Notas de transcripción

La transcripción automática se normalizó («Klena» por CLENA, «plain» por Plane, «t 12. 334 t 39 t 7 t 11 y t 41» por T-12, T-34, T-39, T-07, T-11 y T-41). La frase final de las reglas («riesgos, el alcance, las revisiones. Atrasada…») se leyó como la lista de riesgos de arriba.
