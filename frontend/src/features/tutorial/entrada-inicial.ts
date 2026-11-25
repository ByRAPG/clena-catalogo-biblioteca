import { EVENTO_INTRO_TERMINADA } from './pasos'
import { introPendiente } from './tutorial-visto'

/**
 * Entrada de la portada: la primera vez en la sesión, los elementos suben
 * suavemente (opacity + translateY, ver `app/marco.css`). Se controla con el
 * atributo `data-entrada` de <html>:
 * - `espera`: hay una intro pendiente; los elementos esperan ocultos.
 * - `corre`: la animación está en curso.
 * - sin atributo: no hay animación (ya vista, otra ruta o movimiento reducido).
 * El recorrido guiado se abre después (`alTerminarEntrada`).
 */
export const CLAVE_ENTRADA_VISTA = 'clena:entrada-vista'
export const EVENTO_ENTRADA_TERMINADA = 'clena:entrada-terminada'
/** Escalones (70 ms) + duración (560 ms) con margen. */
export const DURACION_ENTRADA_MS = 1500
/** Si la intro no avisa, la entrada arranca igual pasado este tiempo. */
export const RESPALDO_INTRO_MS = 6500

export function entradaActiva(): boolean {
  return document.documentElement.dataset.entrada !== undefined
}

/** Ejecuta `fn` cuando la entrada termina, o ya mismo si no hay entrada. */
export function alTerminarEntrada(fn: () => void): () => void {
  if (!entradaActiva()) {
    fn()
    return () => undefined
  }
  window.addEventListener(EVENTO_ENTRADA_TERMINADA, fn, { once: true })
  return () => window.removeEventListener(EVENTO_ENTRADA_TERMINADA, fn)
}

/** Decide y arranca la entrada. Se llama una vez, antes de pintar la portada. */
export function iniciarEntrada(): void {
  if (window.location.pathname !== '/') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true) return
  try {
    if (sessionStorage.getItem(CLAVE_ENTRADA_VISTA) !== null) return
    sessionStorage.setItem(CLAVE_ENTRADA_VISTA, 'true')
  } catch {
    return
  }

  const raiz = document.documentElement
  const terminar = () => {
    delete raiz.dataset.entrada
    window.dispatchEvent(new Event(EVENTO_ENTRADA_TERMINADA))
  }
  const correr = () => {
    if (raiz.dataset.entrada === 'corre') return
    raiz.dataset.entrada = 'corre'
    window.setTimeout(terminar, DURACION_ENTRADA_MS)
  }

  if (introPendiente()) {
    raiz.dataset.entrada = 'espera'
    window.addEventListener(EVENTO_INTRO_TERMINADA, correr, { once: true })
    window.setTimeout(correr, RESPALDO_INTRO_MS)
  } else {
    correr()
  }
}
