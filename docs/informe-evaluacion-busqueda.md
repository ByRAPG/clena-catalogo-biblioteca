# Evaluación de la búsqueda semántica

## Objetivo

Medir cuánto aporta la búsqueda vectorial frente a la léxica en el catálogo de Consulta Fácil, comparar los tres modos del endpoint `GET /api/v1/search/works` (`lexical`, `semantic` e `hybrid`) y comprobar si los parámetros de corte actuales (`SEARCH_MIN_SIMILARITY=0.84`, `SEARCH_RELATIVE_CUTOFF=0.04`, `SEARCH_LEXICAL_WEIGHT=2`) son razonables. Corresponde al Issue #100 (T-34, CLENA-56) y alimenta la decisión del modo por defecto descrita en el ADR-08.

## Metodología

**Conjunto de consultas.** 44 consultas ficticias en `backend/test/fixtures/search-eval.json`, cada una con las obras relevantes identificadas por título. Se reparten así: 12 exactas (título, autor, palabra suelta), 6 con errores de escritura, 5 de sinónimos o paráfrasis, 9 por tema, 5 en lenguaje natural y 7 sin respuesta (no debe devolverse nada, p. ej. «declaración de impuestos»).

**Datos.** 60 obras ficticias de la semilla (`backend/prisma/data/catalogo.ts`), con título, autores, temas y categoría. Las obras no tienen resumen, de modo que el vector se calcula solo con esos campos. No se usa información real del CLENA.

**Entorno.** Vista previa local con Docker (backend NestJS, PostgreSQL 16 con pgvector, modelo `multilingual-e5-small` cuantizado q8 ejecutado en el propio proceso, 384 dimensiones). El script `pnpm search:eval` consulta la API por HTTP con `pageSize=50` para cada modo. Tiempos medidos con `curl` sobre la misma API: unos 20 a 30 ms por consulta en modo semántico o híbrido y 30 a 60 ms en modo léxico, con el modelo ya cargado; estas cifras son de una máquina de desarrollo y orientativas.

**Métricas.** Por modo, sobre las consultas con respuesta: recall@10, nDCG@10, MRR y precisión de lo devuelto (relevantes entre devueltas). Sobre las 7 consultas sin respuesta: tasa de falsos positivos (proporción de consultas que devuelven algo). Con 60 obras las cifras son orientativas: una obra de diferencia mueve varias centésimas.

**Recalibración.** Se varió `SEARCH_MIN_SIMILARITY` (0,82 a 0,86) y `SEARCH_RELATIVE_CUTOFF` (0,02 a 0,08), recreando solo el contenedor del backend con la variable cambiada y repitiendo la evaluación completa. Criterio: primero cero falsos positivos en las consultas sin respuesta y, entre las combinaciones que lo cumplen, el mayor recall.

## Resultados

### Configuración actual (0,84 / 0,04 / peso léxico 2)

| Modo | recall@10 | nDCG@10 | MRR | Precisión | Devueltas (media) | Falsos positivos |
|---|---|---|---|---|---|---|
| Léxico | 0,704 | 0,713 | 0,743 | 0,803 | 3,6 | 0,000 |
| Semántico | 0,671 | 0,666 | 0,739 | 0,788 | 3,2 | 0,000 |
| Híbrido | 0,829 | 0,801 | 0,793 | 0,645 | 5,2 | 0,000 |

El modo híbrido mejora el recall en 12,5 puntos sobre el léxico y el nDCG en 8,8 puntos, a costa de precisión (más resultados devueltos, algunos marginales).

### Barrido de umbrales

Modo híbrido (el modo semántico se comporta igual en la tendencia). Falsos positivos sobre las 7 consultas sin respuesta.

| `MIN_SIMILARITY` | `RELATIVE_CUTOFF` | recall@10 | nDCG@10 | MRR | Precisión | Devueltas | Falsos positivos |
|---|---|---|---|---|---|---|---|
| 0,82 | 0,04 | 0,887 | 0,832 | 0,815 | 0,586 | 7,1 | 0,286 |
| 0,83 | 0,04 | 0,860 | 0,820 | 0,806 | 0,613 | 6,0 | 0,143 |
| 0,83 | 0,02 | 0,835 | 0,808 | 0,820 | 0,680 | 4,4 | 0,143 |
| **0,84** | **0,04** | **0,829** | **0,801** | **0,793** | **0,645** | **5,2** | **0,000** |
| 0,84 | 0,02 | 0,813 | 0,789 | 0,793 | 0,695 | 4,2 | 0,000 |
| 0,84 | 0,08 | 0,829 | 0,797 | 0,793 | 0,644 | 5,3 | 0,000 |
| 0,85 | 0,04 | 0,784 | 0,774 | 0,784 | 0,760 | 4,2 | 0,000 |
| 0,86 | 0,04 | 0,759 | 0,755 | 0,784 | 0,781 | 3,8 | 0,000 |

### Antes y después de la recalibración

| | Antes | Después |
|---|---|---|
| `SEARCH_MIN_SIMILARITY` | 0,84 | 0,84 |
| `SEARCH_RELATIVE_CUTOFF` | 0,04 | 0,04 |
| recall@10 híbrido | 0,829 | 0,829 |
| Falsos positivos | 0,000 | 0,000 |

La evaluación confirma los valores vigentes: no se cambian. Bajar el umbral a 0,83 o 0,82 sube el recall (0,860 y 0,887) pero ya devuelve resultados para consultas sin respuesta (1 de 7 y 2 de 7). Subirlo a 0,85 elimina todo riesgo pero pierde 4,5 puntos de recall y casi la mitad del aporte semántico (recall semántico 0,419). El valor 0,84 está justo en el borde: con el modelo e5 las similitudes son altas en general (el negativo más alto ronda 0,83), así que el margen es de una centésima. Reducir el corte relativo a 0,02 mejora la precisión (0,695) y cuesta solo 1,6 puntos de recall; es una alternativa válida si se prefieren listas más cortas.

### Resultados por tipo de consulta (configuración actual)

| Tipo | Observación |
|---|---|
| Exactas y con errores | Resueltas casi siempre por el modo léxico (trigramas); el semántico solo falla en nombres propios poco frecuentes. |
| Temas | El híbrido iguala o supera al mejor de los dos modos. |
| Lenguaje natural | Solo la consulta «una historia de amor del siglo diecinueve» falla en el híbrido. |
| Sinónimos | Aquí la semántica debería brillar y es donde peor sale (ver análisis). |
| Sin respuesta | 0 de 7 devuelven resultados en los tres modos. |

## Análisis de errores

Las consultas con recall 0 en el modo híbrido son pocas y tienen una causa común.

- **«novela de vampiros» → «Drácula», «ballena blanca» → «Moby Dick», «espadachines al servicio del rey» → «Los tres mosqueteros», «monstruo creado por un científico» → «Frankenstein».** Las obras no tienen resumen: el vector solo conoce el título, el autor y los temas. «Drácula» no contiene la palabra «vampiro» en ningún campo, y el modelo no puede inferirlo del título solo con suficiente confianza para superar el umbral. Con un umbral más bajo aparecen estas obras, pero también falsos positivos; no hay una configuración que gane sin perder.
- **«viaje bajo el mar».** Devuelve una obra ficticia por cercanía de palabras («mar»), no la novela esperada, por la misma falta de texto.
- **«una historia de amor del siglo diecinueve».** Consulta larga y poco específica; los vectores de los títulos no capturan época ni género.
- **Modo semántico y nombres propios** («marina ceiba», «Pilar Caracola Ruiz»). El vector de un nombre inventado es poco discriminante; para estos casos manda el léxico, y por eso el híbrido pondera la léxica con peso 2.
- **Falsos positivos.** Ninguno con la configuración actual. El negativo más cercano queda a una centésima del umbral, por lo que un cambio de modelo o de texto de las obras exige repetir la evaluación.

## Limitaciones

- Catálogo ficticio de 60 obras y 44 consultas escritas por el equipo: las cifras no se extrapolan a un catálogo real, con más obras, más ruido y otros autores.
- Las obras de la semilla no tienen resumen, que es justo lo que más ayudaría a la búsqueda semántica.
- Una sola ejecución por configuración (el proceso es determinista, pero no hay intervalos de confianza) y un solo modelo.
- Los tiempos se midieron en una máquina de desarrollo, sin carga concurrente.
- Las relevancias se decidieron por título; no hay juicio de usuarios reales.

## Recomendaciones

1. Mantener `hybrid` como modo por defecto: con la configuración actual gana en recall y nDCG sin falsos positivos, y cae solo en precisión.
2. Conservar `SEARCH_MIN_SIMILARITY=0.84`, `SEARCH_RELATIVE_CUTOFF=0.04` y `SEARCH_LEXICAL_WEIGHT=2`; documentar que el margen es estrecho y repetir `pnpm search:eval` al cambiar el modelo, el catálogo o el texto indexado.
3. Decidir si se añade un campo de resumen a las obras (cambia el modelo de datos y la importación): es la mejora con más efecto esperado sobre los sinónimos lejanos.
4. Cuando exista un catálogo real autorizado por el CLENA, recalibrar con consultas reales de usuarios antes de la puesta en producción.
5. Valorar un corte relativo de 0,02 si la interfaz prefiere listas más cortas, aceptando un recall algo menor.
