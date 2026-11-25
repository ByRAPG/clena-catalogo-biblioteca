/**
 * Revelado al desplazarse: accesos rápidos, resultados y pie suben suavemente
 * (`translate` + `opacity`) cuando entran al viewport. Mejora progresiva:
 * - `data-revelar="css"` en <html>: el CSS usa `animation-timeline: view()` y el
 *   navegador hace todo el trabajo (sin JS por fotograma).
 * - `data-revelar="io"`: respaldo con IntersectionObserver; añade `.revelado` una
 *   sola vez a cada elemento y deja de observarlo.
 * - Sin atributo (sin IntersectionObserver o con ahorro de datos) nada se oculta.
 * El CSS (`app/revelar.css`) solo oculta lo que aún no se reveló cuando el
 * mecanismo está activo, y no oculta nada con movimiento reducido ni en alto contraste.
 */
export const SELECTOR_REVELAR = [
  '.zona-accesos-fila > .rotulo',
  '.zona-accesos .rejilla-cuadros > *',
  "[data-tutorial='primer-resultado'] > *",
  '.pie-fila',
  '.pie-base',
].join(',')

/** Conexión del navegador con el modo de ahorro de datos (no está en el tipo DOM). */
function ahorraDatos(): boolean {
  const conexion = (navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection
  return conexion?.saveData === true
}

/**
 * Activa el modo CSS antes del primer pintado (se llama desde main.tsx): si el
 * atributo llegara después, lo que ya está a la vista pasaría de visible a
 * medio transparente y subiría, un parpadeo. El modo `io` no puede anticiparse:
 * necesita el DOM y marca el atributo en su primera pasada.
 */
export function prepararRevelado(): void {
  if (typeof document === 'undefined' || typeof IntersectionObserver === 'undefined') return
  if (ahorraDatos()) return
  if (typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: view()') === true) {
    document.documentElement.dataset.revelar = 'css'
  }
}

export function iniciarRevelado(): () => void {
  if (typeof document === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return () => undefined
  }
  if (ahorraDatos()) return () => undefined
  const raiz = document.documentElement

  if (typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: view()') === true) {
    raiz.dataset.revelar = 'css'
    return () => {
      delete raiz.dataset.revelar
    }
  }

  const visto = new WeakSet<Element>()
  const observador = new IntersectionObserver(
    (entradas) => {
      // El atributo se pone en la primera pasada: lo que ya está a la vista sube
      // en el mismo cuadro en que se oculta, sin parpadeo.
      raiz.dataset.revelar = 'io'
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue
        entrada.target.classList.add('revelado')
        observador.unobserve(entrada.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  const observar = (nodo: Node) => {
    if (!(nodo instanceof Element)) return
    const candidatos = nodo.matches(SELECTOR_REVELAR) ? [nodo] : []
    nodo.querySelectorAll(SELECTOR_REVELAR).forEach((e) => candidatos.push(e))
    for (const e of candidatos) {
      if (visto.has(e)) continue
      visto.add(e)
      observador.observe(e)
    }
  }
  observar(document.documentElement)
  const cambios = new MutationObserver((lista) => {
    for (const cambio of lista) cambio.addedNodes.forEach(observar)
  })
  cambios.observe(document.documentElement, { childList: true, subtree: true })
  return () => {
    cambios.disconnect()
    observador.disconnect()
    delete raiz.dataset.revelar
  }
}
