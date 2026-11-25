# Guía visual de Consulta Fácil

Referencia para el tema de la interfaz (T-03, T-21) y para el prototipo. Parte de la paleta pública de clena.org y del azul oscuro del logo. **No incluye el logo del CLENA**: su uso requiere autorización escrita (ver `LISTA-CLENA.md`).

## Paleta y contraste (WCAG AA: 4,5:1 en texto normal, 3:1 en texto grande y controles)

El tema real está en `frontend/src/shared/theme/theme.ts`; cada color es una tupla de 10 tonos de Mantine. Las relaciones se calcularon con la fórmula de luminancia de WCAG 2.x.

| Color (tupla) | Tono usado | Hex | Uso | Contraste medido |
|---|---|---|---|---|
| Marca, azul marino (`marca`, color principal) | 8 | `#23234E` | Botón principal, encabezado, pie, enlaces | Texto blanco encima: 14,77. Como texto sobre blanco: 14,77 |
| Marca, hover | 7 | `#2E3470` | Hover de botones | Blanco encima: 11,40 |
| Granate (`granate`) | 8 | `#5B113C` | Acento y títulos destacados | Blanco encima: 13,21 |
| Disponible (`disponible`) | 8 / 0 | `#1B5E20` sobre `#E3F4E5` | Insignia «Disponible» | 6,87; relleno con texto blanco: 7,87 |
| Aviso (`aviso`) | 5 / 8 | `#FFC502`, `#6B3F00` | «No disponible» y avisos | Texto `#1E1E1E` sobre amarillo: 10,51; `#6B3F00` sobre `#FFF3D6`: 8,15 |
| Error (`error`) | 7 / 0 | `#A31621` sobre `#FDE8EA` | Mensajes de error | 6,65; sobre blanco: 7,80 |
| Texto | n/d | `#1F2433` | Cuerpo sobre blanco | 15,46 |
| Texto atenuado | n/d | `#4A5163` | Ayudas y descripciones | Sobre blanco: 7,93 |
| Marcador de campo | n/d | `#5F6676` | Placeholder | Sobre blanco: 5,76 |

Regla: amarillo y naranja de relleno solo con texto oscuro (con blanco no pasan). El gris atenuado por defecto de Mantine (3,3:1) se sustituyó por `#4A5163`.

## Tipografía y tamaños
- Poppins, servida desde el propio sitio con `@fontsource/poppins` (pesos 400, 500, 600 y 700, subconjunto latino con tildes y ñ). No se usa Google Fonts ni ningún CDN. Alternativa si no carga: sans-serif del sistema.
- Texto principal de **18 px** como mínimo (HU-04); títulos de 24 px o más (h1 32 px, h2 24 px, h3 20 px, peso 600). «Letra más grande» sube a 21,6 px y se guarda en el dispositivo. Los tamaños del tema son rem y escalan con esa base.
- Controles (botones y campos) de al menos 2,75 rem (unos 50 px); interlineado 1,5 a 1,6.
- Radios de 0,5 a 1 rem (por defecto 0,75 rem) y sombras suaves en azul marino translúcido.

## Reglas
- La disponibilidad nunca se indica solo con color: lleva texto («Disponible», «No disponible» y el motivo).
- Foco visible de 3 px (`index.css`) en todo control; todo se puede usar con teclado.
- Etiqueta visible en cada campo de formulario; el error aparece junto al campo.
- Diseñar a 360 px de ancho sin desplazamiento horizontal.
- Textos en español sencillo; evitar jerga como «signatura» o «call number»: decir «Sala, sección y estante».
- Sin datos reales del catálogo del CLENA en el repositorio ni en capturas.

## Marco de la aplicación (T-22)
Código: `frontend/src/app/layout.tsx` y `marco.css`; marca en `shared/ui/marca.tsx`; créditos en `shared/ui/creditos-institucionales.tsx`.

- **Isotipo propio:** un libro abierto, geométrico, dibujado con `currentColor` (toma el color del texto: blanco sobre el azul marino y sobre el negro del alto contraste; el trazo interior usa `--isotipo-trazo`). Es decorativo (`aria-hidden`); el nombre «Consulta Fácil» y la línea «Biblioteca del CLENA» van como texto. No imita ningún logo institucional.
- **Cabecera** (`header`): una barra de utilidades con «Letra más grande» y «Alto contraste» (siempre visibles, `aria-pressed`) y, debajo, la marca a la izquierda (enlace al inicio) y la navegación `nav` «Principal» a la derecha (Gestión, Ingresar o Cerrar sesión). La ruta activa lleva `aria-current="page"` y un subrayado grueso. A 360 px la marca y la navegación pasan a dos filas, sin menú desplegable; todos los destinos miden al menos 44 px de alto.
- **Pie** (`footer`): marca, créditos en texto («Corporación Luis Eduardo Nieto Arteta (CLENA)» y «Proyecto académico · Universidad del Norte»), enlace al aviso de privacidad y línea de año y «Prototipo académico». Queda pegado al fondo en páginas cortas (columna con `min-height: 100dvh`) y lleva un filete granate arriba.
- **Pestaña del navegador:** `favicon.svg` (isotipo blanco sobre azul marino), `favicon-32.png`, `apple-touch-icon.png` (180 px, sin transparencia), `icon-192.png`, `icon-512.png`, `manifest.webmanifest`, `theme-color` `#23234E`, `lang="es"`, descripción y metadatos Open Graph sin URL absolutas. El título del documento sigue el patrón «Página · Consulta Fácil» (`app/titulo-pagina.ts`).
- **Movimiento:** solo transiciones de color de 150 ms en enlaces y botones de la cabecera; se anulan con `prefers-reduced-motion`.
- **Alto contraste y letra grande:** cabecera y pie pasan a fondo negro con texto blanco (relación 16,8:1 o más) y subrayado amarillo en la ruta activa; todo está en rem y crece con la letra grande. Foco de 3 px blanco (amarillo en alto contraste).

### Logos esperados
Los logos y fotos que usa hoy la interfaz están en `frontend/public/` y se describen en [`recursos-de-terceros.md`](recursos-de-terceros.md) (aprobados por Rafael el 20 nov, uso académico). Si se reciben archivos oficiales, se sustituye el texto de `CreditosInstitucionales` (único punto de cambio) por imágenes con texto alternativo igual al nombre de la institución. Archivos esperados en `frontend/public/logos/`:

| Archivo | Formato | Uso |
|---|---|---|
| `clena.svg` (o `clena.png`, mínimo 2x) | SVG o PNG de al menos 2x | Logo del CLENA sobre fondo claro |
| `clena-oscuro.svg` | SVG o PNG de al menos 2x | Versión para fondo oscuro (pie y cabecera) |
| `uninorte.svg` (o `.png`, mínimo 2x) | SVG o PNG de al menos 2x | Logo de la Universidad del Norte sobre fondo claro |
| `uninorte-oscuro.svg` | SVG o PNG de al menos 2x | Versión para fondo oscuro |

Se respetará el manual de marca de Uninorte y la autorización escrita del CLENA (ver `LISTA-CLENA.md`).