# Guía de trabajo con IA y MCP

La IA es un asistente permitido por el docente. **Usted es quien responde por lo que sube**: en la presentación cada uno debe explicar su código y puede haber preguntas individuales. Use la IA para acelerar y para aprender, no para entregar lo que no entiende.

## Reglas de oro

1. **La fuente de verdad es el repositorio**, no la memoria de la IA: `AGENTS.md`, `docs/memoria-critica.md`, `docs/arquitectura.md`, `docs/backlog.md` y el Issue de su tarea. Pídale que los lea antes de escribir código.
2. **Nada de secretos** en prompts, código o comentarios (claves, tokens, `.env`). Nada de datos reales del CLENA.
3. **Lea y entienda cada línea** antes de hacer commit. Si no la puede explicar, pida que se la expliquen o simplifíquela.
4. **Una tarea, un PR.** No mezcle cambios que no están en su Issue.
5. **Pruebe** (`lint`, `test`, `build`) antes de abrir el PR. La IA se equivoca con las firmas y las versiones de las librerías: consulte la documentación (Context7).

## Qué contexto darle a la IA

Pegue o adjunte siempre:
- El Issue (historia o tarea) con sus criterios de aceptación.
- El stack: NestJS + TypeScript en Clean Architecture, Prisma, PostgreSQL 16, React + Vite + Mantine.
- Las reglas de capas de `AGENTS.md`: `domain` es TypeScript puro (sin `@nestjs/*` ni `@prisma/*`), los casos de uso reciben repositorios por interfaz, los controladores solo llaman casos de uso, API en `/api/v1`.
- El módulo en que trabaja (`iam`, `catalog`, `search`, `loans`) y los archivos vecinos como ejemplo de estilo.

> Para trabajar una tarea de principio a fin, use las plantillas por fase de [`docs/prompts-por-fase.md`](prompts-por-fase.md) (entender, planear, implementar, probar, PR, estados, revisar, cerrar). Los de abajo son prompts sueltos.

## Prompts que sirven

**Para entender antes de escribir**
> Lee `AGENTS.md`, `docs/arquitectura.md` y el Issue #N. Explícame en 10 líneas qué capas y archivos voy a tocar y por qué, sin escribir código todavía.

**Para implementar**
> Implementa el caso de uso `X` en el módulo `catalog` siguiendo Clean Architecture: entidad y puerto en `domain`, caso de uso en `application`, repositorio Prisma en `infrastructure` y controlador con DTO y Swagger en `presentation`. Incluye la prueba unitaria. No toques otros módulos.

**Para aprender (recomendado)**
> Explícame línea por línea lo que escribiste, y dime qué podría preguntarme el docente sobre este código y cómo lo defendería.

**Para revisar**
> Revisa este diff como revisor de seguridad y arquitectura. Para cada hallazgo dame: qué pasa, por qué importa, un ejemplo y una posible solución, con severidad (Blocker, High, Medium, Low, Question).

**Para probar**
> Genera pruebas unitarias para este caso de uso que cubran el camino feliz, entrada inválida y el caso del criterio «Dado/Cuando/Entonces» del Issue.

## Qué no pedirle

- «Hazlo todo» sin Issue ni criterios.
- Que invente datos del CLENA, cédulas o correos reales.
- Que reescriba archivos que no son suyos.
- Que desactive validaciones, pruebas o el lint «para que pase».

## MCP: herramientas conectadas a la IA

Un MCP deja que el agente de IA lea y escriba en una herramienta (Plane, documentación, etc.).

| MCP | Para qué | Prioridad |
|---|---|---|
| **Plane** | Leer y actualizar sus work items, estados y comentarios | Básico |
| **Context7** | Documentación actualizada de NestJS, Prisma, React, Mantine | Básico |
| GitHub | PRs, Issues y revisiones | Opcional |
| PostgreSQL | Consultar la base en local (solo lectura) | Opcional |
| Playwright | Probar la interfaz en el navegador | Opcional |

### Configuración en OpenCode v2

En el archivo de configuración global de OpenCode (`~/.config/opencode/opencode.json`) o con la CLI:

```bash
opencode mcp add --global
```

Estructura (los secretos van en variables de entorno, **nunca** escritos en el archivo ni en el repositorio):

```json
{
  "mcp": {
    "servers": {
      "plane": {
        "type": "remote",
        "url": "https://mcp.plane.so/http/api-key/mcp",
        "headers": { "Authorization": "Bearer {env:PLANE_API_KEY}", "X-Workspace-slug": "clena-library" },
        "oauth": false
      },
      "context7": {
        "type": "remote",
        "url": "https://mcp.context7.com/mcp"
      },
      "github": {
        "type": "remote",
        "url": "https://api.githubcopilot.com/mcp/",
        "headers": { "Authorization": "Bearer {env:GITHUB_TOKEN}" },
        "oauth": false,
        "disabled": true
      },
      "postgres": {
        "type": "local",
        "command": ["uvx", "postgres-mcp", "--access-mode=restricted"],
        "environment": { "DATABASE_URI": "{env:DATABASE_URL}" },
        "disabled": true
      },
      "playwright": {
        "type": "local",
        "command": ["npx", "@playwright/mcp@latest"],
        "disabled": true
      }
    }
  }
}
```

Notas:
- `disabled: true` los deja instalados pero apagados. Se activan con `/mcps` dentro de OpenCode.
- El token de Plane se crea en Plane → perfil → *Personal Access Tokens*. Cada persona usa el **suyo**. Si el nombre de variable cambia con su versión, revise la documentación de OpenCode.
- Si la sintaxis de su versión difiere, el comando `opencode mcp add --global` pregunta los datos y escribe el archivo por usted.
- No suba su archivo de configuración al repositorio.

### Con Plane conectado, puede pedir

> Muéstrame mis work items del Sprint 1 y su estado.
> Pasa CLENA-12 a In Progress y deja un comentario con el enlace a mi PR.

## Archivos de instrucciones para el agente

- `AGENTS.md`: reglas del repositorio (stack, capas, GitHub Flow). El agente las lee solo.
- `CLAUDE.md`: apunta a `AGENTS.md`, para que las herramientas que lo busquen con ese nombre lo encuentren.

## Cómo declarar el uso de IA

El README tiene una sección «Uso de IA». Si una parte importante de su aporte se hizo con IA, dígalo en el PR (una línea) y esté listo para explicarla. El producto final **no usa IA**.
