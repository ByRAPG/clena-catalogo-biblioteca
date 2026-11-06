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
5. Un compañero deja una revisión con comentarios (rotación).
6. Rafael Potes revisa, aprueba y hace squash merge. Si Rafael no está disponible, o el PR es de Rafael, lo hace Humberto Llinás.
7. Se borra la rama y se verifica el despliegue.

### Quién aprueba y fusiona

Solo **Rafael Potes** (principal) o **Humberto Llinás** (alterno) aprueban y fusionan PRs. Son los *code owners* del repositorio: la aprobación de otra persona no habilita el merge.

### Revisión con comentarios (obligatoria)

El enunciado exige que cada integrante tenga **revisiones propias** en al menos dos sprints. Por eso, en cada PR un compañero deja una revisión de tipo **Comment** (no *Approve*) antes de la aprobación final:

| Autor del PR | Comenta |
|---|---|
| Juan Camilo | Daniel Méndez |
| Daniel Méndez | Orlando Palma |
| Orlando Palma | Juan Camilo |
| Humberto Llinás | Juan Camilo, Daniel Méndez u Orlando Palma (quien tenga menos revisiones esa semana) |
| Rafael Potes | Juan Camilo, Daniel Méndez u Orlando Palma (quien tenga menos revisiones esa semana) |

En GitHub: pestaña **Files changed** → **Review changes** → **Comment**. Debe incluir al menos un comentario concreto (algo que funciona bien, una duda o una mejora). Tiempo máximo: 12 horas.

## Cómo comentar en una revisión

Cada hallazgo indica: **qué** pasa, **por qué** importa, un **ejemplo** y una **posible solución**. Severidad: Blocker, High, Medium, Low o Question. El autor responde con una decisión: corregir ahora, investigar, posponer (con motivo y fecha), aceptar o descartar.
