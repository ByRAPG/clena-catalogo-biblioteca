import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Rutas } from '../../app/rutas'
import { theme } from '../../shared/theme/theme'
import { olvidarRenovacionCompartida } from '../auth/renovacion-compartida'
import { SesionProvider } from '../auth/sesion-provider'

function pintar(rol: 'ADMIN' | 'STAFF' | 'READER' | null, ruta: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn((entrada: string) => {
      if (String(entrada).includes('/auth/refresh')) {
        return Promise.resolve(
          rol === null
            ? new Response('{}', {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
              })
            : Response.json({
                accessToken: 'token-prueba',
                usuario: { nombre: 'Usuario ficticio', rol },
              }),
        )
      }
      return new Promise<Response>(() => {})
    }),
  )
  return render(
    <MantineProvider theme={theme}>
      <SesionProvider>
        <MemoryRouter initialEntries={[ruta]}>
          <Rutas />
        </MemoryRouter>
      </SesionProvider>
    </MantineProvider>,
  )
}

beforeEach(() => olvidarRenovacionCompartida())
afterEach(() => vi.unstubAllGlobals())

describe('Botón de regreso de la gestión', () => {
  it.each([
    ['/gestion', 'Volver al catálogo', '/'],
    ['/gestion/registrar-libro', 'Volver al panel de gestión', '/gestion'],
    ['/gestion/importar', 'Volver al panel de gestión', '/gestion'],
  ])('en %s hay un enlace «%s» hacia %s, antes de las migas', async (ruta, texto, destino) => {
    const { container } = pintar('ADMIN', ruta)
    const enlace = await screen.findByRole('link', { name: new RegExp(texto) })
    expect(enlace.getAttribute('href')).toBe(destino)
    expect(enlace.classList.contains('boton-volver')).toBe(true)
    const migas = container.querySelector('nav[aria-label="Migas de pan"]')
    expect(
      enlace.compareDocumentPosition(migas as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(migas?.querySelector('[aria-current="page"]')).not.toBeNull()
  })

  it('la sección de códigos QR vuelve a las tareas del panel', async () => {
    pintar('ADMIN', '/gestion')
    const enlace = await screen.findByRole('link', {
      name: /Volver a las tareas de gestión/,
    })
    expect(enlace.getAttribute('href')).toBe('#tareas-gestion')
    expect(document.getElementById('tareas-gestion')).not.toBeNull()
  })

  it('en 403 y 404 con sesión del personal ofrece volver al panel o ir al catálogo', async () => {
    pintar('STAFF', '/sin-permiso')
    expect(
      (await screen.findByRole('link', { name: 'Volver al panel de gestión' })).getAttribute('href'),
    ).toBe('/gestion')
    expect(screen.getByRole('link', { name: 'Ir al catálogo' }).getAttribute('href')).toBe('/')
  })

  it('sin sesión solo ofrece volver al catálogo', async () => {
    pintar(null, '/no-existe')
    expect(
      (await screen.findByRole('link', { name: 'Volver al catálogo' })).getAttribute('href'),
    ).toBe('/')
    expect(screen.queryByRole('link', { name: 'Volver al panel de gestión' })).toBeNull()
  })
})
