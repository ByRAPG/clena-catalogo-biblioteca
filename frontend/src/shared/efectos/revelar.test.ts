import { afterEach, describe, expect, it, vi } from 'vitest'
import { iniciarRevelado } from './revelar'

describe('iniciarRevelado', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    delete document.documentElement.dataset.revelar
    document.body.innerHTML = ''
  })

  it('sin IntersectionObserver no activa nada (los elementos nunca quedan ocultos)', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const detener = iniciarRevelado()
    expect(document.documentElement.dataset.revelar).toBeUndefined()
    detener()
  })

  it('con ahorro de datos no activa nada', () => {
    vi.stubGlobal('IntersectionObserver', class {})
    Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true })
    const detener = iniciarRevelado()
    expect(document.documentElement.dataset.revelar).toBeUndefined()
    detener()
    delete (navigator as { connection?: unknown }).connection
  })

  it('con animation-timeline usa solo CSS y limpia el atributo al detenerse', () => {
    vi.stubGlobal('IntersectionObserver', class {})
    vi.stubGlobal('CSS', { supports: () => true })
    const detener = iniciarRevelado()
    expect(document.documentElement.dataset.revelar).toBe('css')
    detener()
    expect(document.documentElement.dataset.revelar).toBeUndefined()
  })

  it('en el respaldo marca .revelado una sola vez al entrar al viewport', () => {
    let alVer: IntersectionObserverCallback = () => undefined
    const observar = vi.fn()
    const dejar = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          alVer = cb
        }
        observe = observar
        unobserve = dejar
        disconnect = vi.fn()
      },
    )
    vi.stubGlobal('CSS', { supports: () => false })
    document.body.innerHTML = '<footer><div class="pie-fila" id="f"></div></footer>'
    const detener = iniciarRevelado()
    expect(observar).toHaveBeenCalledTimes(1)
    const f = document.getElementById('f')!
    alVer([{ isIntersecting: true, target: f } as unknown as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(f.classList.contains('revelado')).toBe(true)
    expect(dejar).toHaveBeenCalledWith(f)
    expect(document.documentElement.dataset.revelar).toBe('io')
    detener()
  })
})
