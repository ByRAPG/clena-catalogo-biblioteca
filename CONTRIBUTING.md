# Cómo contribuir

## Flujo de trabajo (GitHub Flow)

```bash
# 1. Partir de main actualizado
git switch main
git pull

# 2. Crear una rama corta para el issue
git switch -c feat/12-busqueda-parcial

# 3. Trabajar con commits pequeños (Conventional Commits)
git commit -m "feat(search): busca por coincidencia parcial del título"

# 4. Subir la rama y abrir el Pull Request
git push -u origin feat/12-busqueda-parcial
gh pr create --fill
```

## Ramas

| Prefijo | Uso |
|---|---|
| `feat/<issue>-desc` | Nueva funcionalidad |
| `fix/<issue>-desc` | Corrección de error |
| `docs/<issue>-desc` | Documentación y actas |
| `test/<issue>-desc` | Solo pruebas |
| `refactor/<issue>-desc` | Cambio interno sin alterar comportamiento |
| `chore/<issue>-desc`, `ci/<issue>-desc` | Configuración, dependencias, pipelines |

## Commits

Formato: `tipo(alcance): descripción en minúscula y en presente`.

Ejemplos: `feat(catalog): importa obras desde CSV`, `fix(auth): rota el refresh token al renovar`, `test(loans): cubre préstamo de ejemplar ya prestado`.

## Pull Requests

1. Título con formato de commit.
2. `Closes #<issue>` y el identificador de Plane (`CLENA-<n>`).
3. Qué cambia, cómo probarlo y capturas si hay interfaz.
4. Checklist de la Definition of Done completo.
5. Un compañero revisa y aprueba (rotación). Después, revisión final y merge de Rafael Potes.
6. Squash merge, borrar la rama, verificar el despliegue.

### Rotación de revisión

| Autor | Revisor par |
|---|---|
| Juan Camilo | Daniel Méndez |
| Daniel Méndez | Juan Camilo |
| Orlando Palma | Humberto Llinás |
| Humberto Llinás | Orlando Palma |
| Rafael Potes | Quien tenga menos revisiones esa semana |

Objetivo: que cada integrante tenga commits, PRs y revisiones propias en todos los sprints. Tiempo máximo para revisar: 12 horas.

## Cómo comentar en una revisión

Cada hallazgo indica: **qué** pasa, **por qué** importa, un **ejemplo** y una **posible solución**. Severidad: Blocker, High, Medium, Low o Question. El autor responde con una decisión: corregir ahora, investigar, posponer (con motivo y fecha), aceptar o descartar.
