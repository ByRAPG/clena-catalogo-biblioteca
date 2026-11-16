import { MantineProvider } from '@mantine/core'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { olvidarRenovacionCompartida } from '../features/auth/renovacion-compartida'
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

beforeEach(() => {
  olvidarRenovacionCompartida()
  localStorage.setItem(CLAVE_TUTORIAL_VISTO, 'true')
  vi.stubGlobal(
    'fetch',
    vi.fn((entrada: string) =>
      entrada.includes('/auth/refresh')
        ? Promise.resolve(
            new Response(JSON.stringify({ statusCode: 401 }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            }),
          )
        : new Promise<Response>(() => {}),
    ),
  )
})

describe('Marco de la aplicación', () => {
  it('declara los landmarks header, nav con etiqueta, main y footer', async () => {
    pintar('/privacidad')

    expect(screen.getByRole('banner')).toBeDefined()
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeDefined()
    expect(screen.getByRole('main')).toBeDefined()
    expect(screen.getByRole('contentinfo')).toBeDefined()
  })

  it('enlaza la marca con el inicio y muestra Gestión e Ingresar', async () => {
    pintar('/privacidad')

    const inicio = screen.getByRole('link', { name: /Consulta Fácil.*inicio/ })
    expect(inicio.getAttribute('href')).toBe('/')
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    expect(within(nav).getByRole('link', { name: 'Gestión' })).toBeDefined()
    expect(await within(nav).findByRole('link', { name: 'Ingresar' })).toBeDefined()
  })

  it('marca con aria-current la ruta activa', async () => {
    pintar('/ingresar')

    const nav = screen.getByRole('navigation', { name: 'Principal' })
    const ingresar = await within(nav).findByRole('link', { name: 'Ingresar' })
    expect(ingresar.getAttribute('aria-current')).toBe('page')
    expect(
      within(nav).getByRole('link', { name: 'Gestión' }).getAttribute('aria-current'),
    ).toBeNull()
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

describe('tituloDeRuta', () => {
  it('usa el patrón «Página · Consulta Fácil»', () => {
    expect(tituloDeRuta('/')).toBe('Buscar libros · Consulta Fácil')
    expect(tituloDeRuta('/obras/abc')).toBe('Detalle de la obra · Consulta Fácil')
    expect(tituloDeRuta('/gestion/importar')).toBe('Importar catálogo · Consulta Fácil')
    expect(tituloDeRuta('/xyz')).toBe('Página no encontrada · Consulta Fácil')
  })
})
