import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SesionProvider } from '../features/auth/sesion-provider'
import { theme } from '../shared/theme/theme'
import { Rutas } from './rutas'

function pintar(ruta: string) {
  return render(
    <MantineProvider theme={theme} defaultColorScheme="light">
      <SesionProvider>
        <MemoryRouter initialEntries={[ruta]}>
          <Rutas />
        </MemoryRouter>
      </SesionProvider>
    </MantineProvider>,
  )
}

describe('Rutas del catálogo', () => {
  it('muestra la búsqueda en la ruta pública inicial', () => {
    pintar('/')

    expect(
      screen.getByRole('heading', { name: 'Catálogo CLENA' }),
    ).toBeDefined()
  })

  it('muestra el detalle de la obra con su identificador', () => {
    pintar('/obras/42')

    expect(screen.getByText('Obra solicitada: 42')).toBeDefined()
  })

  it('envía a ingresar cuando se abre la gestión sin sesión', () => {
    pintar('/gestion')

    expect(screen.getByRole('heading', { name: 'Ingresar' })).toBeDefined()
    expect(screen.queryByText('Gestión del catálogo')).toBeNull()
  })

  it('muestra un mensaje claro en una ruta inexistente', () => {
    pintar('/no-existe')

    expect(
      screen.getByRole('heading', { name: 'Página no encontrada' }),
    ).toBeDefined()
  })

  it('ofrece el enlace para saltar al contenido principal', () => {
    pintar('/')

    const salto = screen.getByRole('link', { name: 'Saltar al contenido' })
    expect(salto.getAttribute('href')).toBe('#contenido')
  })

  it('deja el contenido dentro de un main con el ancla del salto', () => {
    const { container } = pintar('/')

    expect(container.querySelector('main#contenido')).not.toBeNull()
  })
})
