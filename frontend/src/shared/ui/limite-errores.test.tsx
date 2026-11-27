import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LimiteErrores } from './limite-errores'

function Roto(): never {
  throw new Error('chunk')
}

describe('LimiteErrores', () => {
  afterEach(() => vi.restoreAllMocks())

  it('muestra los hijos si no hay error', () => {
    render(<LimiteErrores>contenido</LimiteErrores>)
    expect(screen.getByText('contenido')).toBeTruthy()
  })

  it('muestra el mensaje y recarga la página al pulsar «Recargar»', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const recargar = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload: recargar })
    render(
      <LimiteErrores>
        <Roto />
      </LimiteErrores>,
    )
    expect(screen.getByRole('alert').textContent).toContain('No se pudo cargar esta sección')
    await userEvent.click(screen.getByRole('button', { name: 'Recargar' }))
    expect(recargar).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
