import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  alTerminarEntrada,
  CLAVE_ENTRADA_VISTA,
  DURACION_ENTRADA_MS,
  entradaActiva,
  iniciarEntrada,
  RESPALDO_INTRO_MS,
} from './entrada-inicial'
import { EVENTO_INTRO_TERMINADA } from './pasos'
import { CLAVE_INTRO_VISTA } from './tutorial-visto'

beforeEach(() => {
  vi.useFakeTimers()
  sessionStorage.clear()
  delete document.documentElement.dataset.entrada
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('iniciarEntrada', () => {
  it('corre la primera vez, avisa al terminar y no repite en la sesión', () => {
    vi.stubEnv('VITE_INTRO_CINEMATICA', 'false')
    iniciarEntrada()
    expect(document.documentElement.dataset.entrada).toBe('corre')
    expect(sessionStorage.getItem(CLAVE_ENTRADA_VISTA)).toBe('true')

    const alTerminar = vi.fn()
    alTerminarEntrada(alTerminar)
    expect(alTerminar).not.toHaveBeenCalled()
    vi.advanceTimersByTime(DURACION_ENTRADA_MS)
    expect(alTerminar).toHaveBeenCalledTimes(1)
    expect(entradaActiva()).toBe(false)

    iniciarEntrada()
    expect(entradaActiva()).toBe(false)
  })

  it('con intro pendiente espera su aviso antes de correr', () => {
    vi.stubEnv('VITE_INTRO_CINEMATICA', 'true')
    iniciarEntrada()
    expect(document.documentElement.dataset.entrada).toBe('espera')
    window.dispatchEvent(new Event(EVENTO_INTRO_TERMINADA))
    expect(document.documentElement.dataset.entrada).toBe('corre')
    vi.advanceTimersByTime(DURACION_ENTRADA_MS)
    expect(entradaActiva()).toBe(false)
  })

  it('con intro pendiente que nunca avisa, corre al pasar el respaldo', () => {
    vi.stubEnv('VITE_INTRO_CINEMATICA', 'true')
    iniciarEntrada()
    vi.advanceTimersByTime(RESPALDO_INTRO_MS)
    expect(document.documentElement.dataset.entrada).toBe('corre')
  })

  it('no anima con movimiento reducido', () => {
    const original = window.matchMedia
    window.matchMedia = ((q: string) => ({
      ...original(q),
      matches: true,
    })) as typeof window.matchMedia
    iniciarEntrada()
    window.matchMedia = original
    expect(entradaActiva()).toBe(false)
  })

  it('alTerminarEntrada llama de inmediato si no hay entrada', () => {
    const fn = vi.fn()
    alTerminarEntrada(fn)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('con la intro ya vista corre de inmediato', () => {
    sessionStorage.setItem(CLAVE_INTRO_VISTA, 'true')
    vi.stubEnv('VITE_INTRO_CINEMATICA', 'true')
    iniciarEntrada()
    expect(document.documentElement.dataset.entrada).toBe('corre')
  })
})
