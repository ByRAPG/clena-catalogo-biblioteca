# Flujo de trabajo

Cómo pasa una tarea de «idea» a «terminada» en este proyecto. Es el flujo que exige el docente (Scrum + GitHub Flow). Léalo completo una vez; después úselo como lista de verificación.

## Herramientas y para qué sirve cada una

| Herramienta | Para qué | ¿Es evidencia para el docente? |
|---|---|---|
| **GitHub Issues** | Historias (`HU-xx`) y tareas técnicas (`T-xx`) | Sí, oficial |
| **GitHub Projects** | Tablero Backlog · To Do · In Progress · In Review · Done | Sí, oficial |
| **GitHub PRs** | Código, revisiones y fusión | Sí, oficial |
| **Plane** | Planificación interna: estimación, módulos, sprints, descripciones largas | No |
| **Teams** | Ceremonias grabadas | Sí (grabación) |

Equivalencia: `HU-n` = work item `CLENA-n` en Plane. `T-01…T-14` = `CLENA-22…35`.

## Ciclo de una tarea (paso a paso)

1. **Elegir** una tarea asignada en Plane o GitHub y leer su Issue completo (criterios Dado/Cuando/Entonces).
2. **Mover a In Progress** (tablero de GitHub y estado en Plane).
3. **Crear la rama** desde `main` actualizado:
   ```bash
   git switch main && git pull
   git switch -c feat/12-busqueda-parcial
   ```
4. **Implementar** respetando la arquitectura (ver `AGENTS.md`). Commits pequeños:
   ```bash
   git commit -m "feat(search): busca por coincidencia parcial del título"
   ```
5. **Probar** en local: `pnpm run lint`, `pnpm test` y `pnpm run build` en `backend/` y `frontend/`.
6. **Abrir el PR**:
   ```bash
   git push -u origin feat/12-busqueda-parcial
   gh pr create --fill
   ```
   En la descripción: `Closes #12`, `CLENA-12`, qué cambia, cómo probarlo, capturas si hay pantalla y el checklist de `docs/definition-of-done.md`.
7. **Mover a In Review.** Pedir la revisión Comment del compañero que corresponde (`CONTRIBUTING.md`).
8. **Responder a la revisión.** Para cada comentario: corregir ahora, investigar, posponer con motivo o descartar con motivo.
9. **Aprobación y fusión.** Solo Rafael (o Humberto si es PR de Rafael o él no está) aprueba y hace *squash merge*. Se borra la rama.
10. **Cerrar.** El Issue se cierra solo por `Closes #12`. La tarjeta pasa a **Done** (solo con PR fusionado). En Plane: estado Done y un comentario con el enlace al PR.

## Ejemplo completo: HU-05 «Abrir el catálogo escaneando un QR»

| Paso | Qué hace Rafael |
|---|---|
| 1 | Lee el Issue #32 (HU-05): dos criterios sobre el QR de entrada y el QR por sala |
| 2 | Mueve la tarjeta a In Progress; en Plane, CLENA-5 a In Progress |
| 3 | `git switch -c feat/17-qr-acceso` |
| 4 | Crea `qr-code.generator.ts` en `infrastructure`, el caso de uso `GenerateRoomQr` en `application` y el endpoint `GET /api/v1/rooms/:id/qr` |
| 5 | Escribe la prueba unitaria del caso de uso y corre lint, test y build |
| 6 | Abre el PR «feat(catalog): genera el QR por sala» con `Closes #32` y `CLENA-5` |
| 7 | Mueve a In Review. Orlando deja una revisión Comment |
| 8 | Responde a Orlando: «Corregido el nombre del DTO» |
| 9 | Humberto aprueba y fusiona (es PR de Rafael) |
| 10 | Issue cerrado, tarjeta en Done, CLENA-5 en Done con el enlace al PR |

## Ceremonias

| Ceremonia | Cuándo | Qué se hace | Evidencia |
|---|---|---|---|
| Sprint Planning | Inicio de cada sprint | Elegir historias y puntos | Acta en `docs/sprint-planning.md` + grabación |
| Daily Scrum | ≥ 3 por semana, 15 min | Qué hice, qué haré, qué me bloquea; **nombrar Issues y PRs** | Acta en `docs/daily-scrum.md` + grabación |
| Sprint Review | Fin del sprint, con el G9 | Demostrar lo terminado; el G9 abre Issues `feedback-cliente` | `docs/sprint-review.md` + grabación |
| Retrospectiva | Después de la Review, solo Backend | Qué funcionó, qué no, qué cambiamos | `docs/sprint-retrospective.md` + grabación |

**Regla de oro:** la fecha del acta debe coincidir con la grabación, los commits y los Issues. Un acta genérica da 0 en Scrum.

## Estados

| Plane | GitHub Projects |
|---|---|
| Backlog | Backlog |
| Todo | To Do |
| In Progress | In Progress |
| Review & Test, Changes Requested | In Review |
| Done (solo con PR fusionado) | Done |
| Blocked, Cancelled | Se mantiene la columna y se comenta el motivo |

## Qué no hacer

- Hacer push directo a `main`.
- Cerrar un Issue sin PR fusionado.
- Fusionar sin la revisión del compañero.
- Subir secretos, grabaciones, bases de datos o datos reales del CLENA.
- Dejar historias a medias: una funcionalidad sin pantalla, prueba o demostración **no cuenta** en el 80 %.
