import './cortina.css'

/** Tiempos de la cortina (ms): cierra, pausa con el logo y abre. Total 2,25 s; se ajusta aquí. */
export const CORTINA_MS = { cierra: 750, pausa: 600, abre: 900 } as const
export const CORTINA_TOTAL_MS = CORTINA_MS.cierra + CORTINA_MS.pausa + CORTINA_MS.abre

const SIN_MOVIMIENTO = '(prefers-reduced-motion: reduce), (forced-colors: active)'

function sinMovimiento() {
  return (
    window.matchMedia?.(SIN_MOVIMIENTO).matches === true ||
    document.documentElement.dataset.altoContraste === 'true'
  )
}

const esperar = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

function crearCapa() {
  const capa = document.createElement('div')
  capa.className = 'cortina'
  capa.setAttribute('aria-hidden', 'true')
  capa.dataset.fase = 'cierra'
  capa.style.setProperty('--cierra', `${CORTINA_MS.cierra}ms`)
  capa.style.setProperty('--abre', `${CORTINA_MS.abre}ms`)
  for (const clase of ['cortina-i', 'cortina-d']) {
    const lado = document.createElement('div')
    lado.className = `cortina-lado ${clase}`
    for (const f of ['cortina-ambar', 'cortina-color']) {
      const s = document.createElement('span')
      s.className = f
      lado.appendChild(s)
    }
    capa.appendChild(lado)
  }
  // Sin el logo (la carpeta public/intro no va en git) la cortina funciona igual.
  const logo = document.createElement('img')
  logo.className = 'cortina-logo'
  logo.alt = ''
  logo.src = '/intro/clena-blanco.svg'
  logo.addEventListener('error', () => logo.remove())
  capa.appendChild(logo)
  return capa
}

/**
 * Cierra una cortina de marca, ejecuta `accion` (p. ej. navegar) y la abre como
 * telón. Con movimiento reducido la acción corre directo. Si la acción falla,
 * la capa se quita y el error se propaga: nunca queda pegada.
 */
export async function ejecutarConCortina(accion: () => void | Promise<void>) {
  if (sinMovimiento()) {
    await accion()
    return
  }
  const capa = crearCapa()
  document.body.appendChild(capa)
  try {
    await esperar(CORTINA_MS.cierra + CORTINA_MS.pausa)
    await accion()
  } catch (error) {
    capa.remove()
    throw error
  }
  capa.dataset.fase = 'abre'
  await esperar(CORTINA_MS.abre)
  capa.remove()
}

/** Para componentes: devuelve la función estable de la cortina. */
export function useCortina() {
  return { ejecutarConCortina }
}
