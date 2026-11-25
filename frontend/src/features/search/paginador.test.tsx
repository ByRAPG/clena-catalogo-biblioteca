import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { theme } from '../../shared/theme/theme'
import { Paginador } from './paginador'

function pintar(pagina: number, total: number, alCambiar = vi.fn()) {
  render(
    <MantineProvider theme={theme}>
      <Paginador pagina={pagina} totalDePaginas={total} alCambiar={alCambiar} />
    </MantineProvider>,
  )
  return alCambiar
}

describe('Paginador', () => {
  it('anuncia la página actual en texto y como navegación con nombre', () => {
    pintar(2, 5)
    expect(screen.getByRole('navigation', { name: 'Páginas de resultados' })).toBeTruthy()
    expect(screen.getByText('Página 2 de 5')).toBeTruthy()
  })

  it('etiqueta en español los controles de navegación', () => {
    pintar(2, 5)
    for (const nombre of ['Primera página', 'Página anterior', 'Página siguiente', 'Última página']) {
      expect(screen.getByRole('button', { name: nombre })).toBeTruthy()
    }
  })

  it('avisa la página elegida al pulsar siguiente y anterior', () => {
    const alCambiar = pintar(2, 5)
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(alCambiar).toHaveBeenLastCalledWith(3)
    fireEvent.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(alCambiar).toHaveBeenLastCalledWith(1)
  })

  it('salta a los extremos con primera y última página', () => {
    const alCambiar = pintar(3, 5)
    fireEvent.click(screen.getByRole('button', { name: 'Última página' }))
    expect(alCambiar).toHaveBeenLastCalledWith(5)
    fireEvent.click(screen.getByRole('button', { name: 'Primera página' }))
    expect(alCambiar).toHaveBeenLastCalledWith(1)
  })
})
