import {
  DURACION_INTRO_MS,
  EVENTO_INTRO_REVELANDO,
  MARGEN_RESPALDO_MS,
} from '../../features/intro/tiempos'

/**
 * Entrada de la portada: la primera vez en la sesión, los contenidos (cabecera,
 * título, buscador, filtros...) suben suavemente (opacity + translateY, ver
 * `app/marco.css`); el fondo del hero nunca se anima. Se controla con el atributo
 * `data-entrada` de <html>:
 * - `espera`: hay una intro pendiente; los contenidos esperan bajo el telón.
 * - `corre`: la animación está en curso (arranca cuando el telón empieza a abrirse).
 * - sin atributo: sin animación (ya vista, otra ruta o movimiento reducido).
 * El recorrido guiado escucha `clena:entrada-terminada`.
 */
export const CLAVE_ENTRADA_VISTA = 'clena:entrada-vista'
export const EVENTO_ENTRADA_TERMINADA = 'clena:entrada-terminada'
/** 7 elementos con escalones de 70 ms + 560 ms de animación, con margen. */
export const DURACION_ENTRADA_MS = 1100
/** Si la intro no avisa, la entrada arranca igual pasado este tiempo. */
export const RESPALDO_ENTRADA_MS = DURACION_INTRO_MS + MARGEN_RESPALDO_MS + 200

const CLAVE_INTRO_VISTA = 'clena:intro-vista'

/** Mismos motivos por los que la intro no se muestra (ver features/intro): no esperarla. */
function introSuprimida(): boolean {
  if (window.matchMedia?.('(forced-colors: active)').matches === true) return true
  const conexion = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return conexion?.saveData === true
}

function introPendiente(): boolean {
  if (import.meta.env.VITE_INTRO_CINEMATICA !== 'true') return false
  if (window.location.pathname !== '/') return false
  if (introSuprimida()) return false
  try {
    return sessionStorage.getItem(CLAVE_INTRO_VISTA) === null
  } catch {
    return false
  }
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
  let respaldo = 0
  let corrio = false
  const correr = () => {
    // Una sola vez: el aviso de la intro y el temporizador de respaldo no se suman.
    // Si el respaldo corriera de nuevo tras terminar, los contenidos ya visibles se
    // ocultarían y volverían a subir (el parpadeo que se veía unos 3 s después de abrir).
    if (corrio) return
    corrio = true
    window.clearTimeout(respaldo)
    raiz.dataset.entrada = 'corre'
    window.removeEventListener(EVENTO_INTRO_REVELANDO, correr)
    window.setTimeout(terminar, DURACION_ENTRADA_MS)
  }

  if (introPendiente()) {
    // Con la intro pendiente, `data-entrada="espera"` tapa la portada con un fondo de
    // marca desde el primer fotograma (ver app/revelar.css) y el módulo de la intro
    // se pide ya: así no se ve la portada «a medio hacer» antes de que llegue el telón.
    void import('../../features/intro/intro-cinematica')
    raiz.dataset.entrada = 'espera'
    window.addEventListener(EVENTO_INTRO_REVELANDO, correr)
    respaldo = window.setTimeout(correr, RESPALDO_ENTRADA_MS)
  } else {
    correr()
  }
}
