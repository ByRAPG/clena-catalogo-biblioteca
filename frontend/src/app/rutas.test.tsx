import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SesionProvider } from '../features/auth/sesion-provider'
import { CLAVE_TUTORIAL_VISTO } from '../features/tutorial/tutorial-visto'
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

beforeEach(() => {
  // Estas pruebas comprueban el mapa de rutas, no las pantallas: la API queda
  // sin responder a propósito, para que cada pantalla se vea en su estado de
  // carga y la prueba no dependa de datos.
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})))
  localStorage.setItem(CLAVE_TUTORIAL_VISTO, 'true')
})

describe('Rutas del catálogo', () => {
  it('muestra la búsqueda en la ruta pública inicial', () => {
    pintar('/')

    expect(
      screen.getByRole('heading', { name: 'Catálogo CLENA' }),
    ).toBeDefined()
  })

  it('abre el detalle de la obra en /obras/:id', () => {
    pintar('/obras/a1b2c3d4-0000-4000-8000-000000000001')

    expect(screen.getByText('Cargando la obra…')).toBeDefined()
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
