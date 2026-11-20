/**
 * Cálculo de posición de la tarjeta del recorrido. Funciones puras (sin DOM)
 * para poder probarlas con distintos tamaños de ventana y de objetivo.
 * Todas las coordenadas son de viewport, en píxeles, y el viewport NO incluye
 * la barra de scroll (se usa `documentElement.clientWidth/Height`).
 */
export interface Caja {
  top: number
  left: number
  width: number
  height: number
}

export type Modo = 'centro' | 'junto' | 'dock' | 'hoja'

export interface Entrada {
  vw: number
  vh: number
  /** Borde inferior de la cabecera flotante (0 si no hay). */
  arriba: number
  objetivo: Caja | null
  tarjeta: { ancho: number; alto: number }
  margen?: number
}

export interface Resultado {
  modo: Modo
  top: number
  left: number
  /** true si, aun así, la tarjeta tapa parte del objetivo (no había sitio). */
  solapa: boolean
}

export const MARGEN_VIEWPORT = 16
/** Holgura del anillo alrededor del objetivo. */
export const HOLGURA_ANILLO = 8
const SEPARACION = 12
export const ANCHO_MAX = 420
export const ANCHO_MOVIL = 640

const entre = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

export function interseca(a: Caja, b: Caja): boolean {
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  )
}

/** Objetivo ensanchado con la holgura del anillo: lo que la tarjeta no debe tapar. */
export function conAnillo(c: Caja): Caja {
  return {
    top: c.top - HOLGURA_ANILLO,
    left: c.left - HOLGURA_ANILLO,
    width: c.width + HOLGURA_ANILLO * 2,
    height: c.height + HOLGURA_ANILLO * 2,
  }
}

/**
 * True si el objetivo está fuera del viewport. Un objetivo dentro de la propia
 * cabecera flotante (p. ej. «Alto contraste») sigue a la vista.
 */
export function objetivoFuera(c: Caja, vh: number): boolean {
  return c.top + c.height <= 0 || c.top >= vh
}

export function esMovil(vw: number): boolean {
  return vw <= ANCHO_MOVIL
}

/** Ancho de la tarjeta para un viewport dado. */
export function anchoTarjeta(vw: number, margen = MARGEN_VIEWPORT): number {
  return Math.min(ANCHO_MAX, vw - margen * 2)
}

/**
 * Dónde poner la tarjeta. Sin objetivo: centrada. Con objetivo: debajo, encima,
 * a la derecha o a la izquierda (centrada en el eje transversal y desplazada
 * hasta caber), la primera que cabe sin tapar el objetivo. Si ninguna cabe, dock
 * centrado abajo (o arriba si abajo tapa el objetivo).
 */
export function calcularPosicion(e: Entrada): Resultado {
  const m = e.margen ?? MARGEN_VIEWPORT
  const { vw, vh, tarjeta } = e
  const { ancho: w, alto: h } = tarjeta
  const minTop = Math.max(m, e.arriba + m / 2)
  const maxTop = Math.max(minTop, vh - m - h)
  const centroX = (vw - w) / 2

  if (e.objetivo === null) {
    return {
      modo: 'centro',
      top: Math.max(minTop, (vh - h) / 2),
      left: Math.max(m, centroX),
      solapa: false,
    }
  }

  const o = e.objetivo
  const prohibido = conAnillo(o)
  const cx = o.left + o.width / 2 - w / 2
  const cy = o.top + o.height / 2 - h / 2
  const caja = (top: number, left: number): Caja => ({ top, left, width: w, height: h })
  const xLibre = (x: number) => entre(x, m, Math.max(m, vw - m - w))
  const yLibre = (y: number) => entre(y, minTop, maxTop)
  const gap = HOLGURA_ANILLO + SEPARACION

  const candidatos: Array<{ top: number; left: number; cabe: boolean }> = [
    {
      // Nunca bajo la cabecera flotante: si el objetivo está en ella, la tarjeta va debajo.
      top: Math.max(o.top + o.height + gap, minTop),
      left: xLibre(cx),
      cabe: Math.max(o.top + o.height + gap, minTop) + h <= vh - m,
    },
    { top: o.top - gap - h, left: xLibre(cx), cabe: o.top - gap - h >= minTop },
    { top: yLibre(cy), left: o.left + o.width + gap, cabe: o.left + o.width + gap + w <= vw - m },
    { top: yLibre(cy), left: o.left - gap - w, cabe: o.left - gap - w >= m },
  ]
  for (const c of candidatos) {
    if (c.cabe && !interseca(caja(c.top, c.left), prohibido)) {
      return { modo: 'junto', top: c.top, left: c.left, solapa: false }
    }
  }

  const abajo = caja(maxTop, xLibre(centroX))
  if (!interseca(abajo, prohibido)) {
    return { modo: 'dock', top: abajo.top, left: abajo.left, solapa: false }
  }
  const arribaDock = caja(minTop, xLibre(centroX))
  if (!interseca(arribaDock, prohibido)) {
    return { modo: 'dock', top: arribaDock.top, left: arribaDock.left, solapa: false }
  }
  return { modo: 'dock', top: abajo.top, left: abajo.left, solapa: true }
}

export interface EntradaScroll {
  /** `top` del objetivo en el viewport ahora. */
  top: number
  alto: number
  scrollY: number
  maxY: number
  vh: number
  arriba: number
  altoTarjeta: number
  movil: boolean
  margen?: number
}

/**
 * Posición de scroll que deja el objetivo en la parte alta del viewport y, si
 * cabe, con la tarjeta entera debajo de él (o la hoja inferior en móvil).
 */
export function destinoScroll(e: EntradaScroll): number {
  const m = e.margen ?? MARGEN_VIEWPORT
  const minimo = e.arriba + 12
  const reserva = e.movil
    ? e.altoTarjeta + m
    : e.altoTarjeta + m + HOLGURA_ANILLO + SEPARACION + HOLGURA_ANILLO
  const tope = e.movil ? e.vh * 0.25 : e.vh * 0.2
  const deseado = Math.max(minimo, Math.min(tope, e.vh - reserva - e.alto))
  return entre(e.scrollY + e.top - deseado, 0, Math.max(0, e.maxY))
}

/** Trazado (evenodd) del velo con un hueco redondeado sobre el objetivo. */
export function trazadoVelo(vw: number, vh: number, hueco: Caja | null): string {
  if (hueco === null) return 'none'
  const r = Math.min(14, hueco.width / 2, hueco.height / 2)
  const x1 = hueco.left
  const y1 = hueco.top
  const x2 = hueco.left + hueco.width
  const y2 = hueco.top + hueco.height
  const f = (n: number) => Math.round(n * 10) / 10
  return (
    `path(evenodd, 'M0 0H${f(vw)}V${f(vh)}H0Z ` +
    `M${f(x1 + r)} ${f(y1)}H${f(x2 - r)}A${r} ${r} 0 0 1 ${f(x2)} ${f(y1 + r)}` +
    `V${f(y2 - r)}A${r} ${r} 0 0 1 ${f(x2 - r)} ${f(y2)}` +
    `H${f(x1 + r)}A${r} ${r} 0 0 1 ${f(x1)} ${f(y2 - r)}` +
    `V${f(y1 + r)}A${r} ${r} 0 0 1 ${f(x1 + r)} ${f(y1)}Z')`
  )
}
