# Prompts por fase

Plantillas para copiar y pegar en su agente de IA (OpenCode, Claude, etc.). Cambie solo lo que está entre `<...>`. Cada prompt le exige al agente **leer primero, preguntar lo que falte y no salirse del alcance**. Usted responde por lo que sube: lea y entienda lo que el agente produzca.

> Antes de empezar, el agente debe tener acceso a este repositorio, a Plane y a GitHub. Si no puede leer algo, que se lo diga: **no debe inventarlo**.

## Reglas comunes (valen para todas las fases)

Pegue este bloque al inicio de cada conversación nueva:

```text
Eres mi asistente en el proyecto P2 «Consulta Fácil» (Biblioteca CLENA, Universidad del Norte). Reglas que no se negocian:
- Lee AGENTS.md, docs/memoria-critica.md y docs/flujo-de-trabajo.md antes de actuar. Prevalecen sobre cualquier skill genérica.
- Trabaja SOLO en mi tarea: <T-xx o HU-xx · CLENA-n · Issue #n>. No toques tareas ni archivos de otras personas.
- Stack obligatorio: NestJS + TypeScript con Clean Architecture, Prisma, PostgreSQL 16, React + TypeScript + Vite + Mantine, Docker.
- domain es TypeScript puro (sin @nestjs/* ni @prisma/*). Los controladores solo llaman casos de uso. Los modelos de Prisma no salen de infrastructure. API en /api/v1.
- Nunca secretos, .env, datos reales del CLENA ni archivos pesados en el repo. Mermaid y PlantUML no se aceptan: los diagramas son imágenes de draw.io.
- Si algo no está claro o falta información, PREGÚNTAME antes de seguir. No inventes requisitos, nombres de archivos ni resultados de pruebas.
- Usa Plane para leer mi work item y mantener su estado al día. Usa los comandos y archivos reales del repo.
Responde en español.
```

---

## Fase 1 · Entender la tarea (sin escribir código)

```text
Fase 1: entender la tarea. No escribas código todavía.

1. Lee mi work item <CLENA-n> en Plane: descripción, criterios de aceptación, estado, comentarios, vínculos y estimación. Lee también mi Issue de GitHub #<n> y la sección de docs/backlog.md.
2. Dime en 10 líneas: qué debo entregar, qué NO está en mi alcance y qué criterios Dado/Cuando/Entonces debo cumplir.
3. Dependencias y bloqueos: ¿qué otras tareas o PR necesito antes? (revisa Plane y los PR abiertos) ¿Algo me bloquea a mí o bloquea a otros?
4. Cronograma: según docs/plan-proyecto.md y el milestone del Issue, ¿esta tarea cabe en su sprint? ¿Cuántos días me quedan? ¿Qué entregable del profesor toca (Entrega 1 vie 13 nov 9:00 am)?
5. Reglas del profesor que aplican a esta tarea (Entrega 1, penalizaciones, Definition of Done).
6. Lista de PREGUNTAS: lo que esté ambiguo o falte. Espera mis respuestas antes de pasar a la fase 2.
```

## Fase 2 · Planear (2 o 3 opciones)

```text
Fase 2: planear. Con lo que entendimos y mis respuestas, propón 2 o 3 planes alternativos para mi tarea <CLENA-n>.

Para cada plan: pasos ordenados, archivos y capas que toca (domain, application, infrastructure, presentation), pruebas que escribirás, riesgos, esfuerzo estimado y por qué respeta Clean Architecture, el stack y el alcance de mi tarea.

Después recomienda uno y dime por qué. Yo escojo. No implementes nada hasta que yo diga «plan aprobado: opción X». Si ningún plan cubre un criterio de aceptación, dímelo.
```

## Fase 3 · Implementar

```text
Fase 3: implementar el plan aprobado (opción <X>) de la tarea <CLENA-n>.

- Rama desde origin/main actualizado: <feat|fix|docs|test|chore>/<n>-<descripcion>. Si hay cambios locales sin guardar, detente y pregúntame.
- Commits pequeños con Conventional Commits en español.
- Respeta las capas: reglas en domain, casos de uso en application, adaptadores en infrastructure, controladores y DTO en presentation. Swagger y paginación en endpoints. Migración y semilla ficticia si hay datos.
- Sin código comentado, console.log de depuración ni TODO sin Issue.
- Si descubres algo que exige salir del alcance, DETENTE y pregúntame.
- Al terminar cada bloque, explícame qué hiciste para que yo pueda defenderlo.
```

## Fase 4 · Probar y revisar antes del commit

```text
Fase 4: verificar antes de hacer commit.

1. Ejecuta en backend/ y/o frontend/: pnpm run lint, pnpm test, pnpm run build y, si toqué la API, pnpm run test:e2e. Muéstrame la salida real; no afirmes que pasaron si no los corriste.
2. Revisa la cobertura de domain y application (meta ≥ 70 %).
3. Autorrevisión del diff contra docs/definition-of-done.md: capas, DTO validados, errores en formato uniforme, sin secretos ni datos reales, Swagger actualizado.
4. Revisa seguridad: validación de entrada, autorización por rol, datos personales mínimos (Ley 1581), dependencias nuevas.
5. Dame una lista de hallazgos (qué, por qué, posible solución) y espera mi decisión antes de corregir.
```

## Fase 5 · Commit y Pull Request

```text
Fase 5: abrir el PR de <CLENA-n> / Issue #<n>.

- Haz push de la rama y abre el PR hacia main con título Conventional Commit.
- Descripción: «Closes #<n> · CLENA-<n>», qué cambia, cómo probarlo, capturas si hay pantalla, resultado de lint/test/build y una línea de «Uso de IA».
- Pide como revisor a quien corresponde según CONTRIBUTING.md (revisión Comment de un compañero, aprobación de Rafael o Humberto).
- No te apruebes tu propio PR. No hagas merge.
```

## Fase 6 · Actualizar estados y documentar (en cada hito)

```text
Fase 6: sincroniza el seguimiento de <CLENA-n> con lo que realmente pasó.

- Plane: al empezar → In Progress. Al abrir el PR → Review & Test, con el enlace al PR como vínculo y un comentario con lo validado (comandos y resultados reales). Si piden cambios → Changes Requested; al corregir → In Progress. Done SOLO cuando el PR esté fusionado y yo lo confirme.
- GitHub Projects: In Progress → In Review → Done en el mismo momento.
- Después de cambiar un estado, léelo de vuelta y confirma que quedó.
- Si la tarea exige documentación (README, docs/, Swagger, acta), actualízala en el mismo PR.
- Recuérdame mi daily: qué hice, qué haré, qué me bloquea, nombrando Issues y PR.
```

## Fase 7 · Revisar el PR de un compañero

```text
Fase 7: revisar el PR #<n> de <compañero> con la skill collaborative-code-review.

- Trae la base y la cabeza del PR con git fetch y anota los SHAs. Revisa solo lo que el PR introduce.
- Busca, en este orden: seguridad y datos, comportamiento incorrecto, requisitos del Issue que falten, errores operativos y pruebas ausentes. Verifica que respete Clean Architecture y las reglas del profesor.
- Cada hallazgo: qué pasa, por qué importa, ejemplo y posible solución, con severidad (Blocker, High, Medium, Low, Question). Agrega también algo concreto que esté bien hecho.
- No edites su código. Prepara el texto de una revisión de tipo COMMENT (no Approve) para que yo lo pegue en GitHub (Files changed → Review changes → Comment).
```

## Fase 8 · Cerrar la tarea

```text
Fase 8: cierre de <CLENA-n>.

- Verifica que el PR esté fusionado (squash) y la rama borrada, que el Issue se haya cerrado y que la tarjeta esté en Done.
- Si no está fusionado, NO marques Done.
- Compara lo entregado con los criterios de aceptación y con docs/definition-of-done.md. Lista lo que falte.
- Deja en Plane un comentario final con el PR, los criterios cumplidos y lo pendiente. Dime qué debería explicar en la sustentación sobre lo que subí.
```

## Fase 9 · Documento o informe en PDF (T-06, T-08, T-12, T-13)

```text
Fase 9: informe en PDF de <modelo-dominio | modelo-datos | arquitectura | inception | daily-scrum | evidencias>.

- Lee la sección del profesor en docs/memoria-critica.md y el Issue #<n>. El entregable lleva portada, índice y números de página.
- Diagramas: imágenes exportadas de draw.io con número y título. Prohibido Mermaid y PlantUML.
- El contenido debe ser real y verificable (fechas, asistentes, Issues y PR nombrados). Un acta genérica da 0 en Scrum.
- Genera el PDF con docs/pdf (ver docs/pdf/README.md) y revisa el resultado página por página.
- No inventes datos ni grabaciones: si falta evidencia, pregúntame.
```

## Después de usar estos prompts

1. Lea el diff completo. Si no entiende una línea, pídale que se la explique o simplifíquela.
2. Pruebe usted mismo la funcionalidad.
3. Prepare 3 frases para explicar su aporte en los 10 minutos de presentación.
