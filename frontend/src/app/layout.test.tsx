import { MantineProvider } from '@mantine/core'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { olvidarRenovacionCompartida } from '../features/auth/renovacion-compartida'
import type { Rol } from '../features/auth/sesion-context'
import { SesionProvider } from '../features/auth/sesion-provider'
import { CLAVE_TUTORIAL_VISTO } from '../features/tutorial/tutorial-visto'
import { theme } from '../shared/theme/theme'
import { Rutas } from './rutas'
import { tituloDeRuta } from './titulo-pagina'

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

function simularApi(rol?: Rol) {
  vi.stubGlobal(
    'fetch',
    vi.fn((entrada: string) => {
      if (!entrada.includes('/auth/refresh')) return new Promise<Response>(() => {})
      return Promise.resolve(
        rol === undefined
          ? new Response(JSON.stringify({ statusCode: 401 }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            })
          : Response.json({
              accessToken: 'jwt-de-prueba',
              usuario: { nombre: 'Persona de Prueba', rol },
            }),
      )
    }),
  )
}

beforeEach(() => {
  olvidarRenovacionCompartida()
  localStorage.setItem(CLAVE_TUTORIAL_VISTO, 'true')
  simularApi()
})

describe('Marco de la aplicación', () => {
  it('declara los landmarks header, nav con etiqueta, main y footer', async () => {
    pintar('/privacidad')

    expect(screen.getByRole('banner')).toBeDefined()
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeDefined()
    expect(screen.getByRole('main')).toBeDefined()
    expect(screen.getByRole('contentinfo')).toBeDefined()
  })

  it('enlaza la marca con el inicio y, sin sesión, muestra Ingresar y no Gestión', async () => {
    pintar('/privacidad')

    const inicio = screen.getByRole('link', { name: /Consulta Fácil.*inicio/ })
    expect(inicio.getAttribute('href')).toBe('/')
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    expect(await within(nav).findByRole('link', { name: 'Ingresar' })).toBeDefined()
    expect(within(nav).queryByRole('link', { name: 'Gestión' })).toBeNull()
  })

  it('no muestra Gestión mientras se resuelve la sesión', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})))
    pintar('/privacidad')

    const nav = screen.getByRole('navigation', { name: 'Principal' })
    expect(within(nav).queryByRole('link', { name: 'Gestión' })).toBeNull()
  })

  it('con sesión del personal muestra Gestión con aria-current en /gestion', async () => {
    simularApi('STAFF')
    pintar('/gestion')

    const nav = screen.getByRole('navigation', { name: 'Principal' })
    const gestion = await within(nav).findByRole('link', { name: 'Gestión' })
    expect(gestion.getAttribute('aria-current')).toBe('page')
    expect(within(nav).queryByRole('link', { name: 'Ingresar' })).toBeNull()
  })

  it('con sesión de lector no ofrece Gestión', async () => {
    simularApi('READER')
    pintar('/privacidad')

    const nav = screen.getByRole('navigation', { name: 'Principal' })
    await within(nav).findByRole('button', { name: 'Cerrar sesión' })
    expect(within(nav).queryByRole('link', { name: 'Gestión' })).toBeNull()
  })

  it('marca con aria-current la ruta activa', async () => {
    pintar('/ingresar')

    const nav = screen.getByRole('navigation', { name: 'Principal' })
    const ingresar = await within(nav).findByRole('link', { name: 'Ingresar' })
    expect(ingresar.getAttribute('aria-current')).toBe('page')
    expect(within(nav).queryByRole('link', { name: 'Gestión' })).toBeNull()
  })

  it('conserva los controles de accesibilidad dentro de la cabecera', async () => {
    pintar('/privacidad')
    const usuario = userEvent.setup()

    const cabecera = screen.getByRole('banner')
    const letra = within(cabecera).getByRole('button', { name: 'Letra más grande' })
    const contraste = within(cabecera).getByRole('button', { name: 'Alto contraste' })
    expect(letra.getAttribute('aria-pressed')).toBe('false')

    await usuario.click(contraste)
    expect(contraste.getAttribute('aria-pressed')).toBe('true')
    expect(document.documentElement.dataset.altoContraste).toBe('true')
  })

  it('ofrece en el pie el aviso de privacidad, los créditos y el año', () => {
    pintar('/ingresar')

    const pie = screen.getByRole('contentinfo')
    expect(
      within(pie).getByRole('link', { name: 'Aviso de privacidad' }).getAttribute('href'),
    ).toBe('/privacidad')
    expect(within(pie).getByText(/Universidad del Norte/)).toBeDefined()
    expect(within(pie).getByText(/Nieto Arteta/)).toBeDefined()
    expect(within(pie).getByText(new RegExp(String(new Date().getFullYear())))).toBeDefined()
  })

  it('actualiza el título del documento por página', () => {
    pintar('/privacidad')
    expect(document.title).toBe('Aviso de privacidad · Consulta Fácil')
  })
})

describe('Título principal por página', () => {
  const rutas = ['/', '/ingresar', '/privacidad', '/sin-permiso', '/no-existe']
  it.each(rutas)('%s tiene exactamente un h1', async (ruta) => {
    const { container } = pintar(ruta)
    await screen.findByRole('navigation', { name: 'Principal' })
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelector('h3')).toBeNull()
  })

  it('la gestión también tiene un h1', async () => {
    simularApi('ADMIN')
    const { container } = pintar('/gestion')
    await screen.findByRole('heading', { level: 1, name: 'Gestión del catálogo' })
    expect(container.querySelectorAll('h1')).toHaveLength(1)
  })
})

describe('tituloDeRuta', () => {
  it('usa el patrón «Página · Consulta Fácil»', () => {
    expect(tituloDeRuta('/')).toBe('Buscar libros · Consulta Fácil')
    expect(tituloDeRuta('/obras/abc')).toBe('Detalle de la obra · Consulta Fácil')
    expect(tituloDeRuta('/gestion/importar')).toBe('Importar catálogo · Consulta Fácil')
    expect(tituloDeRuta('/xyz')).toBe('Página no encontrada · Consulta Fácil')
  })
})
