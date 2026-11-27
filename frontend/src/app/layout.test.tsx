import { MantineProvider } from '@mantine/core'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { olvidarRenovacionCompartida } from '../features/auth/renovacion-compartida'
import type { Rol } from '../features/auth/sesion-context'
import { SesionProvider } from '../features/auth/sesion-provider'
import { EVENTO_CABECERA_MENU } from '../features/tutorial/pasos'
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

    const inicio = screen.getByRole('link', { name: /Busca Fácil.*inicio/ })
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
    expect(document.title).toBe('Aviso de privacidad · Busca Fácil')
  })
})

describe('Cabecera de una sola fila', () => {
  /**
   * jsdom no calcula diseño: se simula una fila del ancho dado cuyos logos miden
   * 400 px y cuyas acciones miden 600 px (necesitan 1000 px con el espacio entre ambos).
   */
  function conAncho(ancho: number) {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get(this: HTMLElement) {
        return this.classList.contains('cabecera-fila') ? ancho : 0
      },
    })
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      const ancho = this.classList.contains('cabecera-logos')
        ? 400
        : this.classList.contains('cabecera-acciones')
          ? 600
          : 0
      return { width: ancho, height: 44, top: 0, left: 0, right: ancho, bottom: 44, x: 0, y: 0, toJSON: () => ({}) }
    })
  }
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth')
  })

  it('siempre muestra los cuatro logos dentro del banner', () => {
    for (const ancho of [390, 1440]) {
      conAncho(ancho)
      const { unmount } = pintar('/privacidad')
      const cabecera = screen.getByRole('banner')
      expect(within(cabecera).getByAltText('Universidad del Norte')).toBeDefined()
      expect(within(cabecera).getByAltText('Corporación CLENA')).toBeDefined()
      expect(within(cabecera).getByAltText('Biblioteca Piloto del Caribe')).toBeDefined()
      expect(within(cabecera).getByRole('link', { name: /Busca Fácil.*inicio/ })).toBeDefined()
      unmount()
    }
  })

  it('en ancho estrecho las acciones van en el menú, que abre y cierra el recorrido', async () => {
    conAncho(390)
    pintar('/privacidad')
    const cabecera = screen.getByRole('banner')
    expect(within(cabecera).queryByRole('button', { name: 'Letra más grande' })).toBeNull()
    const boton = within(cabecera).getByRole('button', { name: 'Menú' })
    expect(boton.getAttribute('aria-expanded')).toBe('false')

    act(() => {
      window.dispatchEvent(new CustomEvent(EVENTO_CABECERA_MENU, { detail: { abierto: true } }))
    })
    expect(boton.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: 'Letra más grande' })).toBeDefined()
    // jsdom no aplica la transición de Mantine: el panel puede figurar «oculto».
    expect(await screen.findByRole('link', { name: 'Ingresar', hidden: true })).toBeDefined()

    act(() => {
      window.dispatchEvent(new CustomEvent(EVENTO_CABECERA_MENU, { detail: { abierto: false } }))
    })
    expect(boton.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('button', { name: 'Letra más grande', hidden: true })).toBeNull()
  })

  it('en ancho amplio las acciones van en la misma fila, sin botón Menú', () => {
    conAncho(1440)
    pintar('/privacidad')
    const cabecera = screen.getByRole('banner')
    expect(within(cabecera).queryByRole('button', { name: 'Menú' })).toBeNull()
    expect(within(cabecera).getByRole('button', { name: 'Alto contraste' })).toBeDefined()
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
  it('usa el patrón «Página · Busca Fácil»', () => {
    expect(tituloDeRuta('/')).toBe('Buscar libros · Busca Fácil')
    expect(tituloDeRuta('/obras/abc')).toBe('Detalle de la obra · Busca Fácil')
    expect(tituloDeRuta('/gestion/importar')).toBe('Importar catálogo · Busca Fácil')
    expect(tituloDeRuta('/mi-cuenta')).toBe('Mi cuenta · Busca Fácil')
    expect(tituloDeRuta('/gestion/usuarios')).toBe('Cuentas del personal · Busca Fácil')
    expect(tituloDeRuta('/xyz')).toBe('Página no encontrada · Busca Fácil')
  })
})
