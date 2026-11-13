import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { olvidarRenovacionCompartida } from '../auth/renovacion-compartida'
import { SesionProvider } from '../auth/sesion-provider'
import { theme } from '../../shared/theme/theme'
import { Rutas } from '../../app/rutas'

/**
 * Monta la pantalla con la sesión que devuelva `POST /auth/refresh`.
 *
 * Desde el ADR-03 el token vive solo en memoria, así que ya no se puede
 * sembrar la sesión escribiendo en `sessionStorage`: se recupera con la
 * cookie al cargar la página. Las llamadas que no son de autenticación se
 * delegan al mock que haya instalado la prueba, para que sus asserts sobre
 * `fetch` sigan contando solo lo suyo.
 */
function pintar(
  rol: 'ADMIN' | 'STAFF' | 'READER' | null,
  ruta = '/gestion/importar',
) {
  const previa = globalThis.fetch
  const delegar = vi.isMockFunction(previa) ? previa : null

  vi.stubGlobal(
    'fetch',
    vi.fn((entrada: string, opciones?: RequestInit) => {
      if (String(entrada).includes('/auth/refresh')) {
        if (rol === null) {
          return Promise.resolve(
            new Response(
              JSON.stringify({ statusCode: 401, message: 'Sesión no válida' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } },
            ),
          )
        }
        return Promise.resolve(
          Response.json({
            accessToken: 'token-prueba',
            usuario: { nombre: 'Usuario ficticio', rol },
          }),
        )
      }
      if (delegar !== null) return delegar(entrada, opciones)
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

beforeEach(() => {
  olvidarRenovacionCompartida()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Importación CSV', () => {
  it('ofrece plantilla descargable y desactiva importar sin archivo', async () => {
    pintar('ADMIN')
    expect(
      (
        await screen.findByRole('link', {
          name: 'Descargar plantilla de ejemplo',
        })
      ).getAttribute('href'),
    ).toContain('/catalog/imports/template')
    expect(
      screen.getByRole('button', { name: 'Importar' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('envía el archivo con el token y muestra éxitos y errores por fila', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          created: 1,
          updated: 0,
          failed: 1,
          rows: [
            { row: 2, status: 'created' },
            {
              row: 3,
              status: 'failed',
              field: 'titulo',
              error: 'Falta el título',
            },
          ],
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { container } = pintar('ADMIN')
    const archivo = new File(['contenido CSV'], 'catalogo.csv', {
      type: 'text/csv',
    })
    Object.defineProperty(archivo, 'text', {
      value: async () => 'contenido CSV',
    })
    // La pantalla aparece cuando `/auth/refresh` devuelve la sesión.
    await screen.findByRole('button', { name: 'Importar' })
    const input = container.querySelector('input[type="file"]')
    if (!input) throw new Error('Falta el selector de archivo')
    fireEvent.change(input, { target: { files: [archivo] } })
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }))
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain(
        'Filas con errores: 1',
      ),
    )
    expect(screen.getByText('titulo: Falta el título')).toBeDefined()
    expect(screen.getByText('Importado correctamente')).toBeDefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers.get('Authorization')).toBe('Bearer token-prueba')
    expect(JSON.parse(options.body)).toEqual({
      content: 'contenido CSV',
      fileName: 'catalogo.csv',
    })
  })

  it('muestra el mensaje de IAM pendiente devuelto por el servidor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: 'Autenticación pendiente de conectar',
            statusCode: 503,
          }),
          { status: 503 },
        ),
      ),
    )
    const { container } = pintar('ADMIN')
    const archivo = new File(['CSV'], 'catalogo.csv')
    Object.defineProperty(archivo, 'text', { value: async () => 'CSV' })
    await screen.findByRole('button', { name: 'Importar' })
    const input = container.querySelector('input[type="file"]')
    if (!input) throw new Error('Falta el selector de archivo')
    fireEvent.change(input, { target: { files: [archivo] } })
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }))
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Autenticación pendiente de conectar',
      ),
    )
  })

  it.each(['STAFF', 'READER'] as const)(
    'impide acceder con rol %s',
    async (rol) => {
      pintar(rol)
      expect(
        await screen.findByRole('heading', { name: 'No tiene permiso' }),
      ).toBeDefined()
    },
  )

  it('envía al ingreso cuando no hay sesión', async () => {
    pintar(null)
    expect(
      await screen.findByRole('heading', { name: 'Ingresar' }),
    ).toBeDefined()
  })

  it('muestra el aviso de privacidad sin sesión y explica el consentimiento pendiente', () => {
    pintar(null, '/privacidad')
    expect(
      screen.getByRole('heading', { name: 'Aviso de privacidad' }),
    ).toBeDefined()
    expect(
      screen.getByText(/Leer esta página no registra consentimiento/),
    ).toBeDefined()
  })
})
