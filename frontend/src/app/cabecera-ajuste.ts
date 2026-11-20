/**
 * Decisión de cuánto se compacta la cabecera. Es una función pura: recibe la
 * holgura (ancho disponible menos ancho necesario, en px) que quedaría en cada
 * nivel de compactación y devuelve el nivel a usar.
 *
 * Niveles (en este orden): 0 fila completa; 1 sin el texto «Biblioteca del
 * CLENA»; 2 logos más bajos; 3 botones con menos relleno; 4 sin los iconos de
 * «Gestión» e «Ingresar»; 5 sin el texto «Busca Fácil» (queda el logo); y
 * `NIVEL_MENU` (6): las acciones se recogen en el botón «Menú».
 */
export const NIVEL_MENU = 6

/** Margen extra (px) que hace falta para volver a un nivel menos compacto. */
export const HISTERESIS_PX = 24

/**
 * Devuelve el primer nivel (el menos compacto) en que cabe en una fila. Para
 * relajar la cabecera respecto del nivel `actual` se pide además `histeresis`
 * píxeles de sobra, de modo que un ancho justo no haga parpadear entre dos niveles.
 */
export function decidirNivel(
  holguras: readonly number[],
  actual: number,
  histeresis: number = HISTERESIS_PX,
): number {
  for (let nivel = 0; nivel < holguras.length; nivel++) {
    const margen = nivel < actual ? histeresis : 0
    if (holguras[nivel] >= margen) return nivel
  }
  return holguras.length
}
