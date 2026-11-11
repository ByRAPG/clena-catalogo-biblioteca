# Datos de semilla y plantilla de importación

Todos los datos de esta carpeta son **ficticios o de dominio público** (obras anteriores a 1930; solo metadatos bibliográficos, sin contenido). Los ISBN inventados tienen formato válido pero no corresponden a ediciones reales. No contienen datos personales ni datos del CLENA. Salas, secciones y estantes son inventados.

- `catalogo.ts`: ubicaciones y libros de la semilla (`pnpm run prisma:seed`, idempotente).
- `plantilla-catalogo.csv`: plantilla que descargará la importación (HU-12). UTF-8, separador `,`.

## Columnas de la plantilla

Compatibles con MARC21 donde aplica. Varios autores o temas en una celda se separan con `;`.

| Columna | MARC21 | Obligatoria | Descripción |
|---|---|---|---|
| `titulo` | 245 | sí | Título |
| `autor` | 100 | sí | Autor o autores (`;`) |
| `tema` | 650 | no | Temas (`;`) |
| `isbn` | 020 | no | ISBN, con o sin guiones |
| `clasificacion` | 082 | no | Clasificación (p. ej. Dewey) |
| `anio` | | no | Año de publicación |
| `editorial` | | no | Editorial |
| `categoria` | | no | Categoría (p. ej. Historia) |
| `sala`, `seccion`, `estante` | | sí si hay ejemplar | Ubicación del ejemplar |
| `codigo_ejemplar` | | sí si hay ejemplar | Código de inventario único |
| `estado` | | no | `DISPONIBLE`, `PRESTADO`, `MANTENIMIENTO` o `BAJA` (por defecto `DISPONIBLE`) |
| `url_digital` | | no | URL de la versión digital |
