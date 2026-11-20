/**
 * Sincroniza el brillo diagonal de la interfaz (ver «Brillo sincronizado» en
 * app/estilos-marca.css). Es UN solo destello que cruza toda la página: cada
 * elemento calcula (en coordenadas de documento) el recorrido local de su
 * banda para que todas las bandas formen el mismo frente diagonal.
 *
 * La animación se crea con la Web Animations API sobre el `::after` de cada
 * elemento, con keyframes en px ya resueltos (los `var()` dentro de keyframes
 * obligan a Blink a resolverlos en cada recálculo de estilos) y con
 * `startTime = 0` en la línea de tiempo del documento: todos comparten el
 * ciclo de 12 s (8 s de recorrido lineal y 4 s de pausa) y la misma fase, sin
 * importar cuándo se monten. Solo `transform`; sin JS por fotograma.
 */
export const CICLO_BRILLO_MS = 12000

export const SELECTOR_BRILLO = [
  '.hero',
  '.cuadro',
  '.resultado',
  '.cabecera-pildora',
  '.pie',
  ".mantine-Button-root[data-variant='filled']",
].join(',')

/** Ángulo de la banda (skewX(-22deg) en el CSS). */
export const ANGULO_BRILLO_GRADOS = 22
const TAN = Math.tan((ANGULO_BRILLO_GRADOS * Math.PI) / 180)
/** Ancho global de la banda, en fracción del ancho de la página. */
export const ANCHO_BANDA = 0.24

export interface RecorridoBrillo {
  /** Ancho global de la banda (px). */
  ancho: number
  /** Desplazamiento local (px) de la banda al empezar y al terminar el recorrido. */
  x0: number
  x1: number
}

/**
 * Recorrido local de la banda de un elemento. El frente global (su centro a la
 * altura `yRef`) va de `-ancho` a `anchoDoc + ancho + altoDoc·tan` y el frente
 * es una recta que se inclina `tan(ángulo)`: en la altura `yc` su centro está en
 * `xGlobal - (yc - yRef)·tan` (la banda se inclina hacia la derecha arriba, como
 * `skewX(-22deg)`). El `translateX` local es ese centro menos `left` menos la
 * mitad del ancho de la banda.
 */
export function recorridoBrillo(
  caja: { left: number; centroY: number },
  pagina: { ancho: number; alto: number },
  yRef = 0,
): RecorridoBrillo {
  const ancho = Math.round(pagina.ancho * ANCHO_BANDA)
  const xg0 = -ancho
  const xg1 = pagina.ancho + ancho + pagina.alto * TAN
  const desfaseY = (caja.centroY - yRef) * TAN
  const local = (xg: number) => xg - desfaseY - caja.left - ancho / 2
  return { ancho, x0: Math.round(local(xg0) * 10) / 10, x1: Math.round(local(xg1) * 10) / 10 }
}

/** Posición en el documento, sin contar transformaciones (entradas animadas). */
function cajaDocumento(el: HTMLElement, pegajoso: boolean) {
  if (pegajoso) {
    const r = el.getBoundingClientRect()
    return {
      left: r.left + window.scrollX,
      centroY: r.top + window.scrollY + r.height / 2,
    }
  }
  let left = 0
  let top = 0
  let nodo: HTMLElement | null = el
  while (nodo !== null) {
    left += nodo.offsetLeft
    top += nodo.offsetTop
    nodo = nodo.offsetParent as HTMLElement | null
  }
  return { left, centroY: top + el.offsetHeight / 2 }
}

/**
 * El CSS oculta el destello (`display: none` en el `::after`) con alto
 * contraste y con movimiento reducido. Al desaparecer el pseudo-elemento, la
 * animación WAAPI queda huérfana y no vuelve cuando reaparece: hay que
 * cancelarla al apagar el destello y crearla de nuevo al encenderlo.
 */
export function brilloPermitido(): boolean {
  if (document.documentElement.dataset.altoContraste === 'true') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches !== true
}

const conBrillo = new Set<HTMLElement>()
const animaciones = new WeakMap<HTMLElement, Animation>()
/** Última geometría aplicada: si no cambia no se toca el DOM (evita recálculos de estilo). */
const ultima = new WeakMap<HTMLElement, string>()
let pendiente = 0

function calcular(el: HTMLElement) {
  if (!brilloPermitido()) return
  const raiz = document.documentElement
  const pagina = { ancho: raiz.clientWidth, alto: Math.max(raiz.scrollHeight, raiz.clientHeight) }
  const pegajoso = el.closest('.cabecera') !== null
  const { ancho, x0, x1 } = recorridoBrillo(cajaDocumento(el, pegajoso), pagina)
  const firma = `${ancho}|${x0}|${x1}`
  if (ultima.get(el) === firma) return
  ultima.set(el, firma)
  el.style.setProperty('--brillo-w', `${ancho}px`)
  animar(el, x0, x1)
}

/** Fracción del ciclo que dura el recorrido (8 s de 12 s); el resto es pausa. */
const FIN_RECORRIDO = 8 / 12

function animar(el: HTMLElement, x0: number, x1: number) {
  if (typeof el.animate !== 'function') return
  const t = (x: number) => `translateX(${x}px) skewX(-${ANGULO_BRILLO_GRADOS}deg)`
  const keyframes = [
    { transform: t(x0), offset: 0 },
    { transform: t(x1), offset: FIN_RECORRIDO },
    { transform: t(x1), offset: 1 },
  ]
  const previa = animaciones.get(el)
  if (previa !== undefined) {
    ;(previa.effect as KeyframeEffect).setKeyframes(keyframes)
    return
  }
  const nueva = el.animate(keyframes, {
    duration: CICLO_BRILLO_MS,
    iterations: Infinity,
    easing: 'linear',
    pseudoElement: '::after',
  })
  nueva.startTime = 0 // mismo origen que el reloj del documento: fase global
  animaciones.set(el, nueva)
}

/** Cancela todas las animaciones y, si el destello vuelve a estar permitido, las recrea. */
function reiniciar() {
  for (const el of conBrillo) {
    animaciones.get(el)?.cancel()
    animaciones.delete(el)
    ultima.delete(el)
  }
  if (!brilloPermitido()) return
  requestAnimationFrame(() => {
    // Fuerza el cálculo de estilos para que el pseudo-elemento ya exista.
    void document.documentElement.getBoundingClientRect()
    for (const el of conBrillo) if (el.isConnected) calcular(el)
  })
}

function recalcular(soloPegajosos = false) {
  if (pendiente !== 0) return
  pendiente = requestAnimationFrame(() => {
    pendiente = 0
    for (const el of conBrillo) {
      if (!el.isConnected) conBrillo.delete(el)
      else if (!soloPegajosos || el.closest('.cabecera') !== null) calcular(el)
    }
  })
}

function fijar(el: Element, tamano: ResizeObserver | null) {
  if (!(el instanceof HTMLElement)) return
  if (!conBrillo.has(el)) {
    conBrillo.add(el)
    tamano?.observe(el)
    calcular(el)
  }
}

/** Arranca el observador global. Devuelve la función que lo detiene. */
export function iniciarBrilloSincronizado(): () => void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => undefined
  }
  const tamano =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => recalcular())
  tamano?.observe(document.documentElement)
  const fijarEn = (nodo: Node) => {
    if (!(nodo instanceof Element)) return
    if (nodo.matches(SELECTOR_BRILLO)) fijar(nodo, tamano)
    nodo.querySelectorAll(SELECTOR_BRILLO).forEach((e) => fijar(e, tamano))
  }
  fijarEn(document.documentElement)
  const observador = new MutationObserver((cambios) => {
    for (const cambio of cambios) cambio.addedNodes.forEach(fijarEn)
    recalcular() // un elemento nuevo desplaza a los de debajo
  })
  observador.observe(document.documentElement, { childList: true, subtree: true })
  const modo = new MutationObserver(reiniciar)
  modo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-alto-contraste'],
  })
  const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  reducido?.addEventListener?.('change', reiniciar)
  const alCambiar = () => recalcular()
  const alDesplazar = () => recalcular(true) // la cabecera es «sticky»
  window.addEventListener('resize', alCambiar)
  window.addEventListener('scroll', alDesplazar, { passive: true })
  return () => {
    observador.disconnect()
    modo.disconnect()
    reducido?.removeEventListener?.('change', reiniciar)
    tamano?.disconnect()
    window.removeEventListener('resize', alCambiar)
    window.removeEventListener('scroll', alDesplazar)
    cancelAnimationFrame(pendiente)
    pendiente = 0
    conBrillo.forEach((el) => animaciones.get(el)?.cancel())
    conBrillo.clear()
  }
}
