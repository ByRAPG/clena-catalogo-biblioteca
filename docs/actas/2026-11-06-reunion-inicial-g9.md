# Acta · Reunión inicial con el Grupo 9

- **Fecha:** viernes 6 de noviembre de 2026
- **Medio:** Microsoft Teams (canal General)
- **Duración:** ~33 minutos
- **Asistentes Backend:** Rafael Potes, Humberto Llinás (se unió en el minuto 2)
- **Asistentes Grupo 9:** Shadia Castro, Derek Pérez, Emiliano Harvey
- **Grabación:** no quedó grabación de la reunión; solo la transcripción automática de Teams. Al final se acordó grabar una recapitulación (enlace en [`evidencias.md`](../evidencias.md)).

## Temas tratados

1. **Ayuda al visitante.** Se descarta un chat donde el usuario escribe. Shadia propone un botón de ayuda más intuitivo, pensando en adultos mayores. Rafael propone que la ayuda termine solicitando que un trabajador del CLENA se acerque.
2. **Mapa de la biblioteca.** Derek propone un plano de la biblioteca donde se toque una zona y se vea el catálogo de ese estante. Se acuerda que es una buena idea pero no es lo principal: la prioridad es buscar por lo que la persona recuerda del libro. Queda como extra.
3. **Problemas del sistema actual.** Derek explica que el software actual del CLENA es muy enredado: pide el nombre y además un código, devuelve libros que no corresponden y no muestra claramente en qué parte está el libro. Ni siquiera a los integrantes del G9 les resultó fácil.
4. **Roles y responsabilidades.** Humberto explica que Backend diseña la arquitectura, la solución y el código; el G9 aporta información del CLENA, revisa los avances y valida en las reviews. Se aclara que el G9 redacta las historias de usuario (los problemas de los usuarios) y Backend construye la solución.
5. **Herramientas.** Backend usará Plane para planificar y GitHub Projects (Backlog, To Do, In Progress, Done) como evidencia oficial. Backend tendrá su propio repositorio (no fork del repositorio del G9), que el G9 debe citar en su informe.
6. **Ceremonias.** Daily Scrum tres veces por semana y Sprint Review al final de cada sprint con el G9.
7. **Prototipo.** El G9 aún no ha hecho prototipos en Figma y no conoce bien la herramienta.
8. **Evidencias.** Las grabaciones se enlazan en `evidencias.md` y se comparten con el docente.

## Decisiones

| # | Decisión | Queda en |
|---|---|---|
| D1 | Se descarta el chat. Se evaluó un botón «Necesito ayuda»; luego se verificó en el enunciado que el chat pertenece al proyecto de la Sala de Internet (P1) y no al alcance mínimo de este proyecto | Sugerencias en `backlog.md` |
| D2 | El mapa de la biblioteca es un extra, fuera del backlog comprometido | Sugerencias en `backlog.md` |
| D3 | Prioridad: buscar por lo que se recuerda del título, autor o tema y ver la ubicación clara | HU-01, HU-02, HU-03 |
| D4 | Repositorio propio de Backend | `clena-catalogo-biblioteca` |
| D5 | Planificación en Plane; GitHub Projects como evidencia oficial | `docs/plan-proyecto.md` |
| D6 | Rafael Potes hace la planificación; Humberto Llinás revisa la arquitectura y el plan | `docs/plan-proyecto.md` |

## Compromisos

| Compromiso | Responsable | Fecha |
|---|---|---|
| Crear el repositorio, el backlog borrador, la arquitectura y el plan | Rafael Potes | 7 nov |
| Revisar arquitectura y plan | Humberto Llinás | 7 nov |
| Compartir el enunciado de Backend al grupo | Humberto Llinás | 6 nov |
| Grabar una recapitulación de la reunión | Rafael Potes | 6 nov |
| Asistir al kickoff y revisar el backlog borrador | Grupo 9 | 7 nov |

## Pendientes para el kickoff (sáb 7 nov)

- Validar el backlog borrador ([`backlog.md`](../backlog.md)) y que cada integrante del G9 registre sus historias como Issues `historia-usuario`.
- Acordar prioridades MoSCoW (Humberto Llinás con Shadia Castro).
- Pedir el plano de la biblioteca y, si el CLENA lo autoriza, un ejemplo del inventario.
- Explicar cómo crear Issues `feedback-cliente` y cuántos se necesitan (mínimo 5).
- Confirmar con el docente la fecha de entrega y sustentación de Backend.
