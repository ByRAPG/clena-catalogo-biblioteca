import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SesionProvider } from '../features/auth/sesion-provider'
import type { Rol } from '../features/auth/sesion-context'
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

/** Nunca responde: deja a la pantalla en su estado de carga. */
const enEspera = () => new Promise<Response>(() => {})

/**
 * `POST /auth/refresh` decide si hay sesión al cargar la página. Con `rol`
 * responde una sesión recuperada; sin él responde 401, que es lo que recibe
 * quien solo viene a consultar el catálogo.
 */
function simularApi(rol?: Rol) {
  vi.stubGlobal(
    'fetch',
    vi.fn((entrada: string) => {
      if (!entrada.includes('/auth/refresh')) return enEspera()
      if (rol === undefined) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ statusCode: 401, message: 'Sesión no válida' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } },
          ),
        )
      }
      return Promise.resolve(
        Response.json({
          accessToken: 'jwt-de-prueba',
          usuario: { nombre: 'Persona de Prueba', rol },
        }),
      )
    }),
  )
}

beforeEach(() => {
  simularApi()
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

describe('Guard de las rutas del personal', () => {
  it('espera a que termine la renovación antes de decidir', () => {
    // Con el refresh aún en vuelo no se puede saber si hay sesión: redirigir
    // aquí sacaría de /gestion a alguien que sí tiene permiso.
    vi.stubGlobal('fetch', vi.fn(enEspera))
    pintar('/gestion')

    expect(screen.getByText('Comprobando su sesión…')).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Ingresar' })).toBeNull()
  })

  it('envía a ingresar cuando se abre la gestión sin sesión', async () => {
    pintar('/gestion')

    expect(await screen.findByRole('heading', { name: 'Ingresar' })).toBeDefined()
    expect(screen.queryByText('Gestión del catálogo')).toBeNull()
  })

  it('envía a sin-permiso cuando el rol no alcanza', async () => {
    simularApi('READER')
    pintar('/gestion')

    expect(
      await screen.findByRole('heading', { name: 'No tiene permiso' }),
    ).toBeDefined()
    expect(screen.queryByText('Gestión del catálogo')).toBeNull()
    // No es un problema de identidad, así que no debe mandar a ingresar.
    expect(screen.queryByRole('heading', { name: 'Ingresar' })).toBeNull()
  })

  it('deja entrar a la gestión con el rol STAFF', async () => {
    simularApi('STAFF')
    pintar('/gestion')

    expect(
      await screen.findByRole('heading', { name: 'Gestión del catálogo' }),
    ).toBeDefined()
  })

  it('deja entrar a la gestión con el rol ADMIN', async () => {
    simularApi('ADMIN')
    pintar('/gestion')

    expect(
      await screen.findByRole('heading', { name: 'Gestión del catálogo' }),
    ).toBeDefined()
  })
})
