import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MS_PAUSA,
  MS_POR_LETRA_BORRAR,
  MS_POR_LETRA_ESCRIBIR,
  prefijoComun,
  usePlaceholderAnimado,
} from './use-placeholder-animado'

const FRASES = ['Hola', 'Hoja', 'Adiós'] as const

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function avanzar(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('prefijoComun', () => {
  it('mide el comienzo compartido', () => {
    expect(prefijoComun('Busque por título', 'Busque por autor')).toBe(11)
    expect(prefijoComun('abc', 'xyz')).toBe(0)
    expect(prefijoComun('abc', 'abc')).toBe(3)
  })
})

describe('usePlaceholderAnimado', () => {
  it('escribe letra por letra, hace una pausa y borra solo lo que cambia', () => {
    const { result } = renderHook(() => usePlaceholderAnimado(FRASES))
    expect(result.current).toBe('')

    avanzar(MS_POR_LETRA_ESCRIBIR)
    expect(result.current).toBe('H')
    avanzar(MS_POR_LETRA_ESCRIBIR * 3)
    expect(result.current).toBe('Hola')

    // En la pausa no cambia nada.
    avanzar(MS_PAUSA - 10)
    expect(result.current).toBe('Hola')

    // «Hola» -> «Hoja» comparten «Ho»: se borran «la» y luego se escribe «ja».
    avanzar(10)
    expect(result.current).toBe('Hol')
    avanzar(MS_POR_LETRA_BORRAR)
    expect(result.current).toBe('Ho')
    avanzar(MS_POR_LETRA_BORRAR + MS_POR_LETRA_ESCRIBIR)
    expect(result.current).toBe('Hoj')
  })

  it('vuelve a la primera frase al terminar la última', () => {
    const { result } = renderHook(() => usePlaceholderAnimado(['a', 'b']))
    avanzar(60 * 40)
    const vistos = new Set<string>()
    for (let i = 0; i < 200; i++) {
      avanzar(20)
      vistos.add(result.current)
    }
    expect(vistos.has('a')).toBe(true)
    expect(vistos.has('b')).toBe(true)
  })

  it('no programa nada si está inactivo y limpia al desmontar', () => {
    const inactivo = renderHook(() => usePlaceholderAnimado(FRASES, false))
    expect(vi.getTimerCount()).toBe(0)
    inactivo.unmount()

    const activo = renderHook(() => usePlaceholderAnimado(FRASES))
    avanzar(MS_POR_LETRA_ESCRIBIR)
    expect(vi.getTimerCount()).toBe(1)
    activo.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('se detiene con la pestaña oculta y sigue al volver', () => {
    const { result } = renderHook(() => usePlaceholderAnimado(FRASES))
    avanzar(MS_POR_LETRA_ESCRIBIR * 2)
    expect(result.current).toBe('Ho')

    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    avanzar(MS_POR_LETRA_ESCRIBIR * 3)
    const congelado = result.current
    avanzar(5000)
    expect(result.current).toBe(congelado)
    expect(vi.getTimerCount()).toBe(0)

    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    avanzar(MS_POR_LETRA_ESCRIBIR * 4)
    expect(result.current.length).toBeGreaterThan(congelado.length - 1)
  })
})
