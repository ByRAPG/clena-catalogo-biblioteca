import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CLAVE_PREFERENCIAS,
  PREFERENCIAS_POR_DEFECTO,
  aplicarPreferencias,
  guardarPreferencias,
  leerPreferencias,
} from './preferencias'

describe('preferencias de accesibilidad', () => {
  beforeEach(() => localStorage.clear())

  it('usa los valores por defecto cuando no hay nada guardado', () => {
    expect(leerPreferencias()).toEqual(PREFERENCIAS_POR_DEFECTO)
    expect(PREFERENCIAS_POR_DEFECTO).toEqual({
      letraGrande: false,
      altoContraste: false,
    })
  })

  it('guarda y vuelve a leer las preferencias', () => {
    const prefs = { letraGrande: true, altoContraste: true }
    expect(guardarPreferencias(prefs)).toBe(true)
    expect(leerPreferencias()).toEqual(prefs)
  })

  it('ignora un valor corrupto', () => {
    localStorage.setItem(CLAVE_PREFERENCIAS, '{no es json')
    expect(leerPreferencias()).toEqual(PREFERENCIAS_POR_DEFECTO)
    localStorage.setItem(CLAVE_PREFERENCIAS, '42')
    expect(leerPreferencias()).toEqual(PREFERENCIAS_POR_DEFECTO)
    localStorage.setItem(CLAVE_PREFERENCIAS, '{"letraGrande":"si"}')
    expect(leerPreferencias()).toEqual(PREFERENCIAS_POR_DEFECTO)
  })

  it('tolera que el storage no esté disponible', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(leerPreferencias()).toEqual(PREFERENCIAS_POR_DEFECTO)
    expect(
      guardarPreferencias({ letraGrande: true, altoContraste: false }),
    ).toBe(false)
  })

  it('aplica los atributos en el elemento raíz', () => {
    const raiz = document.createElement('html')
    aplicarPreferencias({ letraGrande: true, altoContraste: false }, raiz)
    expect(raiz.getAttribute('data-letra-grande')).toBe('true')
    expect(raiz.getAttribute('data-alto-contraste')).toBe('false')
  })
})
