/**
 * Temas que la portada ofrece como punto de partida (HU-07).
 *
 * Están aquí, y no dentro del componente, por dos razones:
 * 1. El bloque «sin resultados» y la portada deben ofrecer los mismos temas:
 *    si cambian en un sitio y no en el otro, la persona ve dos catálogos.
 * 2. Son tres a propósito. La pantalla aparece cuando alguien ya no encontró
 *    lo que buscaba; una lista larga ahí vuelve a dejarlo sin decidir.
 *
 * Los nombres son los temas de la semilla (`backend/prisma/data/catalogo.ts`),
 * así que el enlace siempre lleva a resultados y no a otra pantalla vacía.
 */
export const TEMAS_PORTADA: readonly string[] = [
  'Historia del Caribe',
  'Cuentos infantiles',
  'Poesía romántica',
]

/**
 * Ruta de búsqueda de un tema. Va por `?q=` y no por `?categoria=`: el tema no
 * es una categoría del filtro, y `q` no exige conocer el id que usa el backend.
 */
export function rutaDelTema(tema: string): string {
  return `/?q=${encodeURIComponent(tema)}`
}
