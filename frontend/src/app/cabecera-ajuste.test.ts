import { describe, expect, it } from 'vitest'
import { decidirNivel, NIVEL_MENU } from './cabecera-ajuste'

describe('decidirNivel', () => {
  it('usa la fila completa si cabe', () => {
    expect(decidirNivel([10, 40, 80, 120, 160, 200], 0)).toBe(0)
  })

  it('elige el primer nivel con holgura no negativa', () => {
    expect(decidirNivel([-30, -5, 4, 40, 80, 120], 0)).toBe(2)
    expect(decidirNivel([-30, -5, -4, -3, 0, 120], 0)).toBe(4)
  })

  it('recoge en el menú solo cuando ningún nivel cabe', () => {
    expect(decidirNivel([-90, -70, -50, -30, -10, -1], 0)).toBe(NIVEL_MENU)
  })

  it('con histéresis no relaja la cabecera por un ancho justo', () => {
    // Estaba en el nivel 3 y el nivel 2 solo sobra por 4 px: se queda en 3.
    expect(decidirNivel([-30, -5, 4, 40, 80, 120], 3)).toBe(3)
    // Con 30 px de sobra sí vuelve al nivel 2.
    expect(decidirNivel([-30, -5, 30, 60, 80, 120], 3)).toBe(2)
  })

  it('desde el menú pide margen antes de volver a la barra', () => {
    expect(decidirNivel([-30, -20, -10, -5, 30, 60], NIVEL_MENU)).toBe(4)
    expect(decidirNivel([-30, -20, -10, -5, -1, 10], NIVEL_MENU)).toBe(NIVEL_MENU)
  })

  it('al empeorar el ancho compacta sin margen extra', () => {
    expect(decidirNivel([-1, 5, 30, 60, 80, 120], 0)).toBe(1)
  })
})
