import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EVENTO_INTRO_REVELANDO } from '../../features/intro/tiempos'
import {
  CLAVE_ENTRADA_VISTA,
  DURACION_ENTRADA_MS,
  EVENTO_ENTRADA_TERMINADA,
  iniciarEntrada,
  RESPALDO_ENTRADA_MS,
} from './entrada-portada'

const raiz = document.documentElement

beforeEach(() => {
  vi.useFakeTimers()
  sessionStorage.clear()
  delete raiz.dataset.entrada
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('iniciarEntrada', () => {
  it('sin intro corre de inmediato, avisa al terminar y no repite en la sesión', () => {
    vi.stubEnv('VITE_INTRO_CINEMATICA', 'false')
    iniciarEntrada()
    expect(raiz.dataset.entrada).toBe('corre')
    expect(sessionStorage.getItem(CLAVE_ENTRADA_VISTA)).toBe('true')
    const aviso = vi.fn()
    window.addEventListener(EVENTO_ENTRADA_TERMINADA, aviso, { once: true })
    vi.advanceTimersByTime(DURACION_ENTRADA_MS)
    expect(aviso).toHaveBeenCalledTimes(1)
    expect(raiz.dataset.entrada).toBeUndefined()
    iniciarEntrada()
    expect(raiz.dataset.entrada).toBeUndefined()
  })

  it('con intro espera y arranca cuando el telón empieza a abrirse', () => {
    vi.stubEnv('VITE_INTRO_CINEMATICA', 'true')
    iniciarEntrada()
    expect(raiz.dataset.entrada).toBe('espera')
    window.dispatchEvent(new Event(EVENTO_INTRO_REVELANDO))
    expect(raiz.dataset.entrada).toBe('corre')
  })

  it('con intro, la entrada corre una sola vez: el respaldo no la repite al terminar', () => {
    vi.stubEnv('VITE_INTRO_CINEMATICA', 'true')
    iniciarEntrada()
    window.dispatchEvent(new Event(EVENTO_INTRO_REVELANDO))
    vi.advanceTimersByTime(DURACION_ENTRADA_MS)
    expect(raiz.dataset.entrada).toBeUndefined()
    vi.advanceTimersByTime(RESPALDO_ENTRADA_MS * 2)
    expect(raiz.dataset.entrada).toBeUndefined()
  })

  it('con intro que no avisa, arranca por tiempo y nada queda oculto', () => {
    vi.stubEnv('VITE_INTRO_CINEMATICA', 'true')
    iniciarEntrada()
    vi.advanceTimersByTime(RESPALDO_ENTRADA_MS)
    expect(raiz.dataset.entrada).toBe('corre')
    vi.advanceTimersByTime(DURACION_ENTRADA_MS)
    expect(raiz.dataset.entrada).toBeUndefined()
  })
})
