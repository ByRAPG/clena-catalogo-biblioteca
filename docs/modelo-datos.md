# Modelo de datos

> Responsable: Daniel Méndez · Work item: CLENA-27 (T-06). Este diagrama refleja el esquema de `backend/prisma/schema.prisma` y se actualiza con cada migración. La fuente editable es `docs/diagramas/ModeloER.drawio` (draw.io).

## Resumen de entidades

| Grupo | Tablas | Descripción |
|---|---|---|
| Usuarios y lectores | `users`, `refresh_tokens`, `readers` | Cuentas con rol (`ADMIN`, `STAFF`, `READER`), tokens de refresco con familia de rotación y lectores, que pueden existir sin cuenta |
| Catálogo | `works`, `authors`, `subjects`, `categories`, `work_authors`, `work_subjects`, `copies` | Obras con sus autores, temas y categoría; cada obra tiene uno o más ejemplares físicos |
| Ubicación | `rooms`, `sections`, `shelves` | Sala, sección y estante donde se encuentra cada ejemplar |
| Préstamos y reservas | `loans`, `reservations`, `notifications`, `availability_alerts` | Préstamos de ejemplares a lectores, reservas, recordatorios por préstamo y avisos de disponibilidad |
| Importación | `import_jobs` | Registro de cada importación de catálogo: archivo, filas creadas, actualizadas y fallidas |

## Diagrama entidad-relación

![Figura 1. Diagrama entidad-relación: usuarios y lectores, catálogo, ubicación, préstamos y reservas, e importación](img/ModeloER.png)

## Reglas e índices

| Regla | Cómo se garantiza |
|---|---|
| Un ejemplar solo tiene un préstamo activo | Índice único parcial `loans(copy_id) WHERE returned_at IS NULL` + regla de dominio |
| Un ejemplar solo tiene una reserva activa | Índice único parcial `reservations(copy_id) WHERE status = 'ACTIVA'` |
| Una alerta pendiente por lector y obra | Índice único parcial `availability_alerts(reader_id, work_id) WHERE notified_at IS NULL` |
| No duplicar autores, temas ni categorías | Único en `normalized_name` |
| Código de inventario único | Único en `copies.inventory_code` |
| Recordatorio único por préstamo y tipo | Único `notifications(loan_id, type)` |
| Búsqueda rápida y tolerante | Índice GIN `gin_trgm_ops` sobre `works.search_text`, `authors.normalized_name`, `subjects.normalized_name` |
| Borrado lógico de obras | `works.deleted_at`; la búsqueda pública filtra `deleted_at IS NULL` |
| Eliminación de cuenta (Ley 1581) | Se anonimizan los datos de `users` y `readers` (`anonymized_at`); se conservan los préstamos sin datos personales |
