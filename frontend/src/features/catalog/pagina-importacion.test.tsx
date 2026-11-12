import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SesionProvider } from '../auth/sesion-provider'
import { theme } from '../../shared/theme/theme'
import { Rutas } from '../../app/rutas'

function pintar(
  rol: 'ADMIN' | 'STAFF' | 'READER' | null,
  ruta = '/gestion/importar',
) {
  sessionStorage.clear()
  if (rol)
    sessionStorage.setItem(
      'clena.sesion',
      JSON.stringify({
        token: 'token-prueba',
        nombre: 'Usuario ficticio',
        rol,
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

afterEach(() => {
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

describe('Importación CSV', () => {
  it('ofrece plantilla descargable y desactiva importar sin archivo', () => {
    pintar('ADMIN')
    expect(
      screen
        .getByRole('link', { name: 'Descargar plantilla de ejemplo' })
        .getAttribute('href'),
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

  it.each(['STAFF', 'READER'] as const)('impide acceder con rol %s', (rol) => {
    pintar(rol)
    expect(
      screen.getByRole('heading', { name: 'No tiene permiso' }),
    ).toBeDefined()
  })

  it('envía al ingreso cuando no hay sesión', () => {
    pintar(null)
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeDefined()
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
