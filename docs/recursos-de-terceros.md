# Recursos de terceros en la interfaz

> **Estado: incluidos por decisión de Rafael Potes (20 nov 2026, estilo aprobado con logos y fotos).** Los logos pertenecen a sus instituciones (CLENA, Universidad del Norte, Biblioteca Piloto del Caribe) y las fotos a sus titulares; se usan solo con fines académicos, para mostrar la interfaz con la identidad institucional. Sigue pendiente la autorización escrita del CLENA y de la Universidad del Norte, que gestiona el profesor; si la niegan, se retiran del repositorio cuando Rafael lo indique. El código funciona igual sin ellos (ver «Cómo se retiran»).

## Qué archivos son

| Archivo (`frontend/public/`) | Qué es | Dónde se usa |
|---|---|---|
| `Logo_Clena-white.svg` | Logo del CLENA en blanco | Pie de página |
| `BPCHorizontal2.png` | Logo de la Biblioteca Piloto del Caribe | Cabecera |
| `intro/clena-amarillo.svg`, `intro/clena-blanco.svg` | Logo del CLENA (amarillo y blanco) | Cabecera, intro y cortina de ingreso |
| `intro/uninorte*.png` (`uninorte.png`, `uninorte-blanco.png`, `uninorte-recorte.png`) | Logo de la Universidad del Norte (versión blanca aproximada) | Cabecera e intro |
| `fondos/interior.webp`, `fondos/pov.webp` | Fotos de la biblioteca | Fondo de la portada y de las franjas de color |
| `intro/biblioteca.webp`, `intro/bloque-k.webp` | Fotos de la biblioteca y del Bloque K de Uninorte | Intro cinemática (apagada por defecto) |

Origen: material público de referencia de los sitios y espacios del CLENA, de la Biblioteca Piloto del Caribe y de la Universidad del Norte, tomado por el equipo con fines académicos. No se modificó su significado; las fotos llevan un filtro de color de marca. Los logos y las fotos pertenecen a sus titulares.

## Cómo se retiran

1. Borrar los archivos de la tabla (`git rm`).
2. No hace falta cambiar código: si un logo falta, su enlace desaparece de la cabecera y del pie sin dejar imagen rota; si faltan las fotos, la portada y las franjas usan el degradado azul marino y granate; la intro y la cortina funcionan sin logos y la intro está apagada salvo con `VITE_INTRO_CINEMATICA=true`.
3. Dejar constancia en `docs/guia-visual.md` y en el acta correspondiente.

Nota: borrar los archivos no los quita del historial de Git; si hiciera falta, se coordina con el profesor.
