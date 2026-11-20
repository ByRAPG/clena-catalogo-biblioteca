# Acta · Sprint Review 2

- **Fecha:** jueves 19 de noviembre de 2026, último día del Sprint 2. La grabación empieza a las 4:27 p.m. hora de Colombia (21:27 UTC; el nombre del archivo de Teams, `20261119_212731`, está en UTC) y termina a las 4:35 p.m. (21:35 UTC); duración de la reunión completa unos 8 minutos y 10 segundos
- **Medio:** Microsoft Teams (canal General), **grabada**, sin compartir pantalla. Una sola sesión con tres partes: esta Review, la [retrospectiva](2026-11-19-sprint-retrospective-2.md) y el [Sprint Planning 3](2026-11-19-sprint-planning-3.md). Grabación: [Teams/SharePoint](https://uninorte.sharepoint.com/sites/CLENA-IntroxBackend/Documentos%20compartidos/General/Recordings/Meeting%20in%20General-20261119_212731-Meeting%20Recording.mp4?web=1) (también en [`evidencias.md`](../evidencias.md))
- **Asistentes de Backend:** Rafael Potes (Scrum Master, modera y es secretario), Humberto Llinás, Juan Camilo Fernández, Daniel Méndez
- **Asistente del Grupo 9:** Emiliano Harvey (Product Owner del Grupo 9)
- **Ausentes:** Orlando Palma (Backend). Rafael dijo que no estaban «el resto del G9 porque no lo requerimos» (Shadia Castro y Derek Pérez no fueron convocados a esta sesión)

## Constancia sobre el Planning 2

Rafael dejó constancia, tal como se dijo en la grabación: **el Sprint 2 no tuvo reunión de Planning 2**. Se planeó por escrito el 15 de noviembre, en los Issues y en Plane. No se hizo un Planning 2 retroactivo.

## Cómo se presentó

No se compartió pantalla. Las capturas y un video del producto se enviaron antes por WhatsApp para su revisión, y en la reunión se leyó y se habló el estado para que quedara en la grabación. Emiliano confirmó que el Grupo 9 recibió las capturas y el video.

## Objetivo y estado real del Sprint 2

- **Objetivo:** que la aplicación se vea como el CLENA, sea segura y entienda lo que el lector busca. **60 puntos.**
- En GitHub **no hay ningún pull request fusionado desde la Entrega 1**.
- Hay **15 pull requests abiertos, todos de Rafael, sin ninguna revisión**. Siete apuntan a `main` con la integración continua en verde; ocho van apilados y se probaron en local.
- Como «Hecho» significa pull request fusionado, **ninguna tarea del Sprint 2 está hoy en Hecho**. Lo que se dijo que está hecho y en revisión es la búsqueda semántica, la seguridad, el tema y la cabecera.

## Qué se informó como hecho (en revisión)

| Tema | Lo dicho en la reunión |
|---|---|
| Búsqueda semántica | Modelo local que corre en el servidor propio, sin servicios externos; reindexado y búsqueda híbrida que degrada a la léxica. Evaluación **preliminar** con 44 consultas ficticias: la híbrida acierta el **83 %** de los 10 primeros resultados frente al **71 %** de la léxica. Límite: sin un resumen de cada obra (hoy solo título, autor y tema), los sinónimos lejanos no se resuelven |
| Seguridad | Cabeceras, límite de peticiones, Dependabot, CodeQL, gitleaks, Trivy, imagen de producción sin root y comando para crear el primer administrador |
| Calidad | Cobertura de **99 %** en backend y **93 %** en frontend |
| Marca | Tema, cabecera y estilo «Busca Fácil» con cuatro logos (Universidad del Norte, CLENA, Biblioteca Piloto y Busca Fácil), portada, coincidencias resaltadas y tutorial, en el pull request #115. Los logos y fotos del CLENA y de Uninorte están de forma **provisional**, solo para la previsualización del profesor, y se retiran si el profesor o el CLENA niegan la autorización |
| Falta | La documentación de cierre: informe de la búsqueda, informe de seguridad, despliegue y manuales |

## Avance por persona

| Persona | Lo que informó |
|---|---|
| Humberto Llinás | Informó sobre su situación de pull requests y revisiones; **el tramo es ininteligible en la transcripción automática**. A partir de ese día abre en borrador el pull request de la tarea 35 (T-35, Issue #101), empieza a revisar los pull requests de Rafael, comenzando por los que apuntan a `main`, y avisa por escrito en el Issue cualquier bloqueo |
| Juan Camilo Fernández | Aún no hay pull request suyo de este sprint. A partir de ese día abre en borrador el de la tarea 27 (T-27, Issue #93, arreglo de seguridad del inicio de sesión), sigue con la historia de usuario 18 (HU-18, Issue #45) y avisa por escrito cualquier bloqueo |
| Daniel Méndez | Aún no hay pull request suyo de este sprint. A partir de ese día abre en borrador el de la historia de usuario 11 (HU-11, Issue #38) y avisa por escrito cualquier bloqueo |
| Orlando Palma | Ausente. Rafael dijo que en GitHub no hay pull request suyo de este sprint y que le escribe ese día para que lo confirme por escrito en sus Issues |

## Feedback del Grupo 9

Emiliano Harvey dijo que lo registrará en el feedback del Grupo 9 como Issue y en su repositorio, y que confirmará con los Issues #50, #51, #52 y #53 si quedaron resueltos. **No dictó el número de un Issue nuevo** durante la grabación. El Grupo 9 seguirá pidiendo al CLENA el sistema de catálogo que usan, una muestra con autorización escrita y la autorización escrita de los logos.

## Estado de las tareas del Sprint 2 (complemento del secretario)

Datos de Issues y pull requests a 19 de noviembre, de `PLAN-EJECUCION`; **no se dictaron uno por uno en la reunión**. «Aceptada por el G9»: pendiente en todos, porque ninguna está fusionada ni el Grupo 9 la aceptó.

| Issue | Tarea | Estado | Demostrada | Aceptada por el G9 |
|---|---|---|---|---|
| #57 | T-18 seguridad (cabeceras, límites, Dependabot, CodeQL) | PR #109 en revisión | Capturas y video enviados por WhatsApp; explicada | Pendiente |
| #58 | T-19 imagen de producción (1.ª parte) | PR #114 en revisión | Explicada | Pendiente |
| #86 | T-20 imagen pgvector | PR #108 en revisión | Explicada | Pendiente |
| #87, #88 | T-21 tema, T-22 cabecera | PR #110 y #115 en revisión | Capturas y video por WhatsApp | Pendiente |
| #89 a #92 | T-23 a T-26 búsqueda semántica (ADR-08, embeddings, puerto, reindexado) | PR #112, #113, #111 y #117 en revisión | Explicada | Pendiente |
| #16 | T-12 documentación de cierre | Estas actas | No aplica | No aplica |
| #18, #34, #38, #43, #45, #93, #94, #95, #96, #101, #102 | Tareas de los demás integrantes | Sin pull request | No | No |

## Acuerdos

| # | Acuerdo | Responsable | Fecha |
|---|---|---|---|
| 1 | Humberto abre en borrador el pull request de T-35 y empieza a revisar los de Rafael | Humberto Llinás | 19 nov |
| 2 | Juan Camilo abre en borrador el pull request de T-27 y sigue con HU-18 | Juan Camilo Fernández | 19 nov |
| 3 | Daniel abre en borrador el pull request de HU-11 | Daniel Méndez | 19 nov |
| 4 | Rafael escribe a Orlando para que confirme por escrito en sus Issues | Rafael Potes | 19 nov |
| 5 | El Grupo 9 registra el feedback y confirma los Issues #50 a #53 | Emiliano Harvey | Sin fecha dicha |

## Notas de transcripción

La transcripción automática de Teams se normalizó al redactar el acta (por ejemplo, «Klena» y «Krena» por CLENA, «plain» por Plane, «ISU» por Issue, «git leags» por gitleaks, «try be» por Trivy, «code QL» por CodeQL). El tramo de Humberto sobre su pull request y su revisión previos es ininteligible; se redactó solo lo que se entiende. Las observaciones del Grupo 9 se dijeron en general; no se mencionó ningún número de Issue nuevo.
