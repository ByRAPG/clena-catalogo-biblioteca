import { MantineProvider } from '@mantine/core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '../../shared/theme/theme'
import { CampoBusqueda } from './campo-busqueda'
import { PLACEHOLDER_BUSCADOR } from './textos'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function pintar(valor = '') {
  return render(
    <MantineProvider theme={theme}>
      <CampoBusqueda valorInicial={valor} />
    </MantineProvider>,
  )
}

describe('CampoBusqueda', () => {
  it('conserva la etiqueta real y un marcador estático', () => {
    pintar()
    const campo = screen.getByLabelText('Busque por título, autor o tema')
    expect(campo.getAttribute('placeholder')).toBe(PLACEHOLDER_BUSCADOR)
  })

  it('muestra el texto animado (decorativo) y lo oculta al enfocar o escribir', () => {
    const { container } = pintar()
    act(() => {
      vi.advanceTimersByTime(55 * 4)
    })
    const escritura = container.querySelector('.campo-busqueda-escritura')
    expect(escritura).not.toBeNull()
    expect(escritura?.getAttribute('aria-hidden')).toBe('true')
    expect(escritura?.textContent).toBe('¿Qué')

    const campo = screen.getByLabelText('Busque por título, autor o tema')
    fireEvent.focus(campo)
    expect(container.querySelector('.campo-busqueda-escritura')).toBeNull()

    fireEvent.input(campo, { target: { value: 'mar' } })
    fireEvent.blur(campo)
    expect(container.querySelector('.campo-busqueda-escritura')).toBeNull()

    fireEvent.input(campo, { target: { value: '' } })
    expect(container.querySelector('.campo-busqueda-escritura')).not.toBeNull()
  })

  it('no anima si la búsqueda ya tiene texto', () => {
    const { container } = pintar('mar')
    expect(container.querySelector('.campo-busqueda-escritura')).toBeNull()
  })

  it('marca el campo con data-animando mientras se anima (de ahí cuelga el CSS que oculta el marcador, también en alto contraste)', () => {
    pintar()
    const campo = screen.getByLabelText('Busque por título, autor o tema')
    expect(campo.getAttribute('data-animando')).toBe('true')
    fireEvent.focus(campo)
    expect(campo.getAttribute('data-animando')).toBe('false')
  })
})