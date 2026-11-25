/**
 * Duración total de la intro (≈ 1,9 s). Para cambiarla basta este número: el CSS
 * deriva de él (variable `--dur`) todas las fases como fracciones.
 */
export const DURACION_INTRO_MS = 1900
/** Margen del temporizador de respaldo sobre la duración de la animación. */
export const MARGEN_RESPALDO_MS = 800
/** Fracción de la intro en la que el telón empieza a abrirse (coincide con `intro-sale` en el CSS). */
export const FRACCION_TELON = 0.71
/** Evento que avisa que el telón se está abriendo: la portada empieza a entrar. */
export const EVENTO_INTRO_REVELANDO = 'clena:intro-revelando'
