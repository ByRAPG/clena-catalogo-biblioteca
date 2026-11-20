/**
 * Concepto de logo de Busca Fácil que usa la interfaz (único valor a cambiar):
 * `a` lupa-B, `b` libro con lupa, `c` logotipo horizontal «Busca Fácil» con una
 * lupa en lugar de la «a», `bf` el monograma BF anterior. Los dibujos de los
 * cuatro están en `public/logos-alt/`. Para cambiar también el favicon y los
 * iconos: `node scripts/aplicar-logo.mjs <concepto>` (actualiza esta constante).
 */
export type ConceptoLogo = 'a' | 'b' | 'c' | 'bf'

export const CONCEPTO_LOGO: ConceptoLogo = 'c'

/**
 * Esquema de color del logotipo C y de su versión compacta «BF» (valor a cambiar):
 * 1 texto blanco y lupa ámbar; 2 texto amarillo CLENA y lupa blanca; 3 placa ámbar
 * con texto marino y lupa granate. Los colores son variables CSS (`logo.css`).
 * En la vista previa (`VITE_PREVIEW_LOGOS=true`) `?logo=1|2|3` lo cambia al vuelo.
 */
export type EsquemaLogo = 1 | 2 | 3

export const ESQUEMA_LOGO: EsquemaLogo = 2
