# Generación de PDF de la documentación

Las fuentes de los informes son los `.md` de `docs/`. Este paquete genera, para cada uno, un PDF (tamaño Carta) con portada, índice con números de página, encabezado/pie «Página X de Y» y figuras con leyenda, como exige el docente. Los PDF se escriben en `docs/<id>.pdf`.

## Requisitos

- Node.js 20 o superior (probado con 24).
- Microsoft Edge o Google Chrome. Por defecto se usa Edge; en Linux/CI define `PDF_CHROME_PATH` con la ruta del ejecutable de Chrome/Chromium.
- draw.io Desktop (solo para exportar diagramas): `winget install JGraph.Draw`. Si no se autodetecta, define `DRAWIO_PATH`.

## Comandos

Desde `docs/pdf/`:

```powershell
pnpm install                          # una sola vez
pnpm run diagramas                    # docs/diagramas/*.drawio -> docs/img/*.png
pnpm run pdf                          # todos los documentos de documentos.json
pnpm run docs                         # diagramas y luego PDF
node build.mjs arquitectura inception   # solo esos documentos
node build.mjs arquitectura --fecha "6 de noviembre de 2026" --version 1.1
node build.mjs --fuente ruta.md --salida ruta.pdf --titulo "Prueba"   # modo de prueba
```

Un documento con `"horizontal": true` en `documentos.json` se genera con el cuerpo en orientación horizontal (la portada sigue vertical), útil para tablas anchas.

Si una fuente de `documentos.json` no existe, se omite con un aviso (salvo que se pida por id). Si algún documento tiene errores, el resto se genera y el comando termina con código 1.

## Reglas

- Los diagramas se dibujan en draw.io: fuente `.drawio` en `docs/diagramas/` y PNG exportado en `docs/img/` (mismo nombre).
- En el Markdown se incrustan como imagen con alt `Figura N. Título`, por ejemplo `![Figura 1. Contexto del sistema](img/contexto.png)`. Si el alt no empieza por «Figura», se numera automáticamente y se muestra un aviso.
- **Prohibido** usar bloques ` ```mermaid `, ` ```plantuml ` o `@startuml`, y enlaces en lugar de imagen: el script falla indicando archivo y línea.
- El `# H1` del `.md` es el título del documento (va en la portada, no en el índice). El índice lista los `##` y `###`.
- Las rutas de imagen son relativas al `.md` y se incrustan en el PDF.

## Agregar un documento

Añadir una entrada en `documentos.json`:

```json
{ "id": "mi-informe", "fuente": "../mi-informe.md", "titulo": "Mi informe", "version": "1.0" }
```

Los datos de portada (equipo, integrantes, docente, ciudad) están en `proyecto.json`.

## Limitaciones

- El número de página del índice se calcula en pasadas sucesivas buscando un marcador invisible junto a cada encabezado; el marcador es texto blanco de 1 px y no se ve, pero queda en el texto extraíble del PDF.
- La portada se genera aparte y se une al resto: no lleva encabezado ni pie, y la numeración «Página X de Y» la cuenta como página 1 (el índice es la página 2).
