import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  iniciarBrilloSincronizado,
  recorridoBrillo,
} from './brillo-sincronizado'

describe('iniciarBrilloSincronizado', () => {
  let detener = () => {}
  afterEach(() => {
    detener()
    document.body.innerHTML = ''
  })

  it('calcula la geometría en los elementos existentes y en los que se insertan después', async () => {
    document.body.innerHTML = '<div class="resultado" id="a"></div>'
    detener = iniciarBrilloSincronizado()
    expect(document.getElementById('a')?.style.getPropertyValue('--brillo-w')).toMatch(/px$/)

    const nuevo = document.createElement('section')
    nuevo.innerHTML = '<div class="cuadro" id="b"></div><p id="c"></p>'
    document.body.append(nuevo)
    await Promise.resolve()
    expect(document.getElementById('b')?.style.getPropertyValue('--brillo-w')).toMatch(/px$/)
    expect(document.getElementById('c')?.style.getPropertyValue('--brillo-w')).toBe('')
  })
})

describe('animación global del brillo', () => {
  it('todas arrancan en startTime 0 con el mismo ciclo lineal de 12 s', () => {
    const animar = vi.fn(() => ({ startTime: null, cancel: vi.fn() }))
    HTMLElement.prototype.animate = animar as unknown as HTMLElement['animate']
    document.body.innerHTML = '<div class="resultado"></div><div class="cuadro"></div>'
    const detener = iniciarBrilloSincronizado()
    expect(animar).toHaveBeenCalledTimes(2)
    for (const [, opciones] of animar.mock.calls as unknown as [unknown, KeyframeAnimationOptions & { pseudoElement: string }][]) {
      expect(opciones).toMatchObject({ duration: 12000, easing: 'linear', pseudoElement: '::after' })
    }
    detener()
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate
    document.body.innerHTML = ''
  })
})

describe('alto contraste y movimiento reducido', () => {
  it('cancela el brillo al activar el alto contraste y lo recrea al desactivarlo', async () => {
    const cancelar = vi.fn()
    const animar = vi.fn(() => ({ startTime: null, cancel: cancelar }))
    HTMLElement.prototype.animate = animar as unknown as HTMLElement['animate']
    document.body.innerHTML = '<div class="cuadro"></div>'
    const detener = iniciarBrilloSincronizado()
    expect(animar).toHaveBeenCalledTimes(1)

    document.documentElement.dataset.altoContraste = 'true'
    await vi.waitFor(() => expect(cancelar).toHaveBeenCalledTimes(1))
    expect(animar).toHaveBeenCalledTimes(1)

    document.documentElement.dataset.altoContraste = 'false'
    await vi.waitFor(() => expect(animar).toHaveBeenCalledTimes(2))

    detener()
    delete document.documentElement.dataset.altoContraste
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate
    document.body.innerHTML = ''
  })
})

describe('recorridoBrillo', () => {
  const pagina = { ancho: 1440, alto: 2000 }

  it('empieza fuera del borde izquierdo y termina fuera del derecho para todo elemento', () => {
    for (const caja of [
      { left: 0, centroY: 30 },
      { left: 600, centroY: 900 },
      { left: 1300, centroY: 1990 },
    ]) {
      const r = recorridoBrillo(caja, pagina)
      expect(caja.left + r.x0 + r.ancho).toBeLessThanOrEqual(0)
      expect(caja.left + r.x1).toBeGreaterThanOrEqual(pagina.ancho)
    }
  })

  it('todas las bandas forman el mismo frente: centro global igual a la misma altura de referencia', () => {
    const t = Math.tan((22 * Math.PI) / 180)
    const a = { left: 100, centroY: 200 }
    const b = { left: 700, centroY: 1200 }
    const ra = recorridoBrillo(a, pagina)
    const rb = recorridoBrillo(b, pagina)
    // Posición global del centro de la banda proyectada a la altura 0.
    const global = (c: typeof a, x: number, w: number) => c.left + x + w / 2 + c.centroY * t
    expect(global(a, ra.x0, ra.ancho)).toBeCloseTo(global(b, rb.x0, rb.ancho), 0)
    expect(global(a, ra.x1, ra.ancho)).toBeCloseTo(global(b, rb.x1, rb.ancho), 0)
  })
})
