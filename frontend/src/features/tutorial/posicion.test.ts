import { describe, expect, it } from 'vitest'
import {
  MARGEN_VIEWPORT,
  anchoTarjeta,
  calcularPosicion,
  conAnillo,
  destinoScroll,
  interseca,
  objetivoFuera,
  trazadoVelo,
  type Caja,
} from './posicion'

const VIEWPORTS = [
  { vw: 1263, vh: 720 },
  { vw: 1425, vh: 900 },
  { vw: 1905, vh: 1080 },
  { vw: 1024, vh: 600 },
]

const OBJETIVOS: Caja[] = [
  { top: 300, left: 200, width: 900, height: 120 }, // buscador ancho
  { top: 150, left: 24, width: 1100, height: 70 }, // filtros
  { top: 200, left: 100, width: 800, height: 320 }, // tarjeta de resultado
  { top: 20, left: 1100, width: 200, height: 44 }, // accesibilidad (arriba a la derecha)
  { top: 600, left: 40, width: 100, height: 40 }, // abajo a la izquierda
]

describe('calcularPosicion', () => {
  for (const v of VIEWPORTS) {
    for (const o of OBJETIVOS) {
      it(`cae dentro del viewport y sin tapar el objetivo (${v.vw}x${v.vh}, objetivo ${o.width}x${o.height})`, () => {
        const ancho = anchoTarjeta(v.vw)
        const alto = 330
        const r = calcularPosicion({ ...v, arriba: 0, objetivo: o, tarjeta: { ancho, alto } })
        const m = MARGEN_VIEWPORT
        expect(r.top).toBeGreaterThanOrEqual(m)
        expect(r.left).toBeGreaterThanOrEqual(m)
        expect(r.top + alto).toBeLessThanOrEqual(v.vh - m)
        expect(r.left + ancho).toBeLessThanOrEqual(v.vw - m)
        if (!r.solapa) {
          expect(interseca({ top: r.top, left: r.left, width: ancho, height: alto }, conAnillo(o))).toBe(false)
        }
      })
    }
  }

  it('sin objetivo la tarjeta va centrada', () => {
    const r = calcularPosicion({
      vw: 1000,
      vh: 800,
      arriba: 0,
      objetivo: null,
      tarjeta: { ancho: 420, alto: 300 },
    })
    expect(r.modo).toBe('centro')
    expect(r.left).toBe(290)
    expect(r.top).toBe(250)
  })

  it('centra la tarjeta respecto a un objetivo ancho en vez de alinearla a su borde', () => {
    const r = calcularPosicion({
      vw: 1400,
      vh: 900,
      arriba: 0,
      objetivo: { top: 200, left: 100, width: 1000, height: 100 },
      tarjeta: { ancho: 420, alto: 300 },
    })
    expect(r.modo).toBe('junto')
    expect(r.left + 210).toBeCloseTo(600, 0)
  })

  it('un objetivo muy alto manda la tarjeta al dock inferior centrado', () => {
    const vw = 1280
    const r = calcularPosicion({
      vw,
      vh: 720,
      arriba: 0,
      objetivo: { top: 90, left: 100, width: 1000, height: 380 },
      tarjeta: { ancho: 420, alto: 330 },
    })
    expect(r.modo).toBe('dock')
    expect(r.left).toBe((vw - 420) / 2)
    expect(r.top + 330).toBe(720 - MARGEN_VIEWPORT)
  })

  it('un objetivo dentro de la cabecera lleva la tarjeta debajo de ella', () => {
    const r = calcularPosicion({
      vw: 1280,
      vh: 720,
      arriba: 142,
      objetivo: { top: 20, left: 900, width: 300, height: 44 },
      tarjeta: { ancho: 420, alto: 300 },
    })
    expect(r.modo).toBe('junto')
    expect(r.top).toBeGreaterThanOrEqual(142)
  })

  it('respeta la cabecera flotante', () => {
    const r = calcularPosicion({
      vw: 1280,
      vh: 720,
      arriba: 130,
      objetivo: { top: 600, left: 100, width: 300, height: 60 },
      tarjeta: { ancho: 420, alto: 300 },
    })
    expect(r.top).toBeGreaterThanOrEqual(130)
  })

  it('marca el solapamiento cuando es imposible evitarlo', () => {
    const r = calcularPosicion({
      vw: 500,
      vh: 400,
      arriba: 0,
      objetivo: { top: 0, left: 0, width: 500, height: 400 },
      tarjeta: { ancho: 420, alto: 300 },
    })
    expect(r.solapa).toBe(true)
  })
})

describe('destinoScroll', () => {
  const base = { alto: 100, vh: 800, arriba: 100, altoTarjeta: 300, movil: false, maxY: 3000 }
  it('deja el objetivo en la parte alta, bajo la cabecera', () => {
    const y = destinoScroll({ ...base, top: 900, scrollY: 0 })
    expect(900 - y).toBeGreaterThanOrEqual(112)
    expect(900 - y).toBeLessThanOrEqual(800 * 0.2 + 1)
  })
  it('no se sale del documento', () => {
    expect(destinoScroll({ ...base, top: 50, scrollY: 0 })).toBe(0)
    expect(destinoScroll({ ...base, top: 5000, scrollY: 0 })).toBe(3000)
  })
  it('en móvil deja sitio a la hoja inferior', () => {
    const y = destinoScroll({ ...base, vh: 740, movil: true, top: 900, scrollY: 0 })
    expect(900 - y).toBeLessThan(740 / 2)
  })
})

describe('utilidades', () => {
  it('detecta el objetivo fuera de la zona visible', () => {
    expect(objetivoFuera({ top: -300, left: 0, width: 10, height: 100 }, 700)).toBe(true)
    expect(objetivoFuera({ top: 800, left: 0, width: 10, height: 100 }, 700)).toBe(true)
    expect(objetivoFuera({ top: 300, left: 0, width: 10, height: 100 }, 700)).toBe(false)
  })
  it('el velo sin hueco no se recorta', () => {
    expect(trazadoVelo(100, 100, null)).toBe('none')
    expect(trazadoVelo(100, 100, { top: 10, left: 10, width: 50, height: 40 })).toContain('evenodd')
  })
})
