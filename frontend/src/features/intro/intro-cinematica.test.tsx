import { act, fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import IntroCinematica from './intro-cinematica'
import {
  DURACION_INTRO_MS,
  EVENTO_INTRO_REVELANDO,
  FRACCION_TELON,
  MARGEN_RESPALDO_MS,
} from './tiempos'

function pintar(ruta = '/') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <IntroCinematica />
    </MemoryRouter>,
  )
}

describe('IntroCinematica', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => vi.useRealTimers())

  it('se muestra en la portada y queda marcada en la sesión', () => {
    const { container } = pintar()
    expect(container.querySelector('.intro')).not.toBeNull()
    expect(sessionStorage.getItem('clena:intro-vista')).toBe('1')
  })

  it('no se muestra fuera de la portada ni por segunda vez', () => {
    expect(pintar('/obras/1').container.querySelector('.intro')).toBeNull()
    sessionStorage.setItem('clena:intro-vista', '1')
    expect(pintar().container.querySelector('.intro')).toBeNull()
  })

  it('no se muestra con movimiento reducido', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
    expect(pintar().container.querySelector('.intro')).toBeNull()
  })

  it('una tecla o un clic la quitan y avisan', () => {
    const aviso = vi.fn()
    window.addEventListener('clena:intro-terminada', aviso)
    const { container } = pintar()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.querySelector('.intro')).toBeNull()
    expect(aviso).toHaveBeenCalledTimes(1)
    window.removeEventListener('clena:intro-terminada', aviso)
  })

  it('el botón Saltar animación la quita', () => {
    const { container, getByText } = pintar()
    fireEvent.click(getByText('Saltar animación'))
    expect(container.querySelector('.intro')).toBeNull()
  })

  it('se retira sola al cumplirse la duración más el margen', () => {
    vi.useFakeTimers()
    const { container } = pintar()
    act(() => vi.advanceTimersByTime(DURACION_INTRO_MS + MARGEN_RESPALDO_MS))
    expect(container.querySelector('.intro')).toBeNull()
  })

  it('dura unos 1,9 s y avisa que el telón se abre al 71 % de la duración', () => {
    expect(DURACION_INTRO_MS).toBe(1900)
    vi.useFakeTimers()
    const aviso = vi.fn()
    window.addEventListener(EVENTO_INTRO_REVELANDO, aviso)
    pintar()
    act(() => vi.advanceTimersByTime(DURACION_INTRO_MS * FRACCION_TELON - 10))
    expect(aviso).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(20))
    expect(aviso).toHaveBeenCalledTimes(1)
    window.removeEventListener(EVENTO_INTRO_REVELANDO, aviso)
  })

  it('al saltarla también avisa que se revela, una sola vez', () => {
    const aviso = vi.fn()
    window.addEventListener(EVENTO_INTRO_REVELANDO, aviso)
    const { getByText } = pintar()
    fireEvent.click(getByText('Saltar animación'))
    expect(aviso).toHaveBeenCalledTimes(1)
    window.removeEventListener(EVENTO_INTRO_REVELANDO, aviso)
  })
})
