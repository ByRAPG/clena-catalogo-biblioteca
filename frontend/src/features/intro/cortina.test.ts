import { afterEach, describe, expect, it, vi } from 'vitest'
import { CORTINA_MS, CORTINA_TOTAL_MS, ejecutarConCortina } from './cortina'

const TOTAL = CORTINA_TOTAL_MS

describe('ejecutarConCortina', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.querySelectorAll('.cortina').forEach((c) => c.remove())
  })

  it('cierra, ejecuta la acción y se retira sola en 2,25 s', async () => {
    vi.useFakeTimers()
    const accion = vi.fn()
    const fin = ejecutarConCortina(accion)
    expect(document.querySelector('.cortina')).not.toBeNull()
    expect(accion).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(CORTINA_MS.cierra + CORTINA_MS.pausa)
    expect(accion).toHaveBeenCalledTimes(1)
    expect(document.querySelector('.cortina')?.getAttribute('data-fase')).toBe('abre')
    await vi.advanceTimersByTimeAsync(CORTINA_MS.abre)
    await fin
    expect(document.querySelector('.cortina')).toBeNull()
    expect(TOTAL).toBe(2250)
  })

  it('navega aunque falle la imagen del logo', async () => {
    vi.useFakeTimers()
    const accion = vi.fn()
    const fin = ejecutarConCortina(accion)
    document.querySelector('.cortina-logo')?.dispatchEvent(new Event('error'))
    expect(document.querySelector('.cortina-logo')).toBeNull()
    await vi.advanceTimersByTimeAsync(TOTAL)
    await fin
    expect(accion).toHaveBeenCalledTimes(1)
  })

  it('con movimiento reducido ejecuta la acción directo, sin capa', async () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
    const accion = vi.fn()
    await ejecutarConCortina(accion)
    expect(accion).toHaveBeenCalledTimes(1)
    expect(document.querySelector('.cortina')).toBeNull()
  })

  it('si la acción falla no deja la capa pegada y propaga el error', async () => {
    vi.useFakeTimers()
    const fin = ejecutarConCortina(() => {
      throw new Error('falló la navegación')
    })
    const resultado = expect(fin).rejects.toThrow('falló la navegación')
    await vi.advanceTimersByTimeAsync(CORTINA_MS.cierra + CORTINA_MS.pausa)
    await resultado
    expect(document.querySelector('.cortina')).toBeNull()
  })
})
