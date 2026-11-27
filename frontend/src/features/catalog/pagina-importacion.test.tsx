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

async function elegirArchivo(contenedor: HTMLElement) {
  const archivo = new File(['contenido CSV'], 'catalogo.csv', {
    type: 'text/csv',
  })
  Object.defineProperty(archivo, 'text', {
    value: async () => 'contenido CSV',
  })
  await screen.findByRole('button', { name: 'Simular' })
  const input = contenedor.querySelector('input[type="file"]')
  if (!input) throw new Error('Falta el selector de archivo')
  fireEvent.change(input, { target: { files: [archivo] } })
}

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
      screen.getByRole('button', { name: 'Simular' }).hasAttribute('disabled'),
    ).toBe(true)
  })

  it('simula, muestra el resumen y confirma la importación con el token', async () => {
    const fetchMock = vi.fn((url: string) => {
      const esVista = String(url).endsWith('/preview')
      return Promise.resolve(
        Response.json({
          importId: esVista ? undefined : 'id-1',
          dryRun: esVista,
          created: 1,
          updated: 0,
          failed: 1,
          works: { created: 1, updated: 0 },
          copies: { created: 1, updated: 0 },
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
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    const { container } = pintar('ADMIN')
    await elegirArchivo(container)
    fireEvent.click(await screen.findByRole('button', { name: 'Simular' }))
    await screen.findByRole('button', { name: 'Confirmar importación' })
    expect(screen.getByText(/Libros por crear: 1/)).toBeDefined()
    expect(screen.getByText(/Fila 3: titulo: Falta el título/)).toBeDefined()
    expect(screen.getByRole('button', { name: 'Elegir otro archivo' })).toBeDefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [urlVista, options] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ]
    expect(urlVista).toContain('/catalog/imports/preview')
    expect((options.headers as Headers).get('Authorization')).toBe(
      'Bearer token-prueba',
    )
    expect(JSON.parse(options.body as string)).toEqual({
      content: 'contenido CSV',
      fileName: 'catalogo.csv',
    })

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar importación' }))
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain(
        'Filas con errores: 1',
      ),
    )
    expect(screen.getByText('titulo: Falta el título')).toBeDefined()
    expect(screen.getByText('Importado correctamente')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Importar otro archivo' })).toBeDefined()
    expect(
      screen
        .getAllByRole('link', { name: /Volver al panel de gestión/ })[0]
        .getAttribute('href'),
    ).toBe('/gestion')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[1][0]).endsWith('/catalog/imports')).toBe(
      true,
    )
  })

  it('descarga el CSV de errores de la importación ejecutada', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (String(url).endsWith('/errors')) {
        return Promise.resolve(
          new Response('fila,campo,error\n3,titulo,Falta', {
            headers: { 'Content-Type': 'text/csv' },
          }),
        )
      }
      return Promise.resolve(
        Response.json({
          importId: 'id-1',
          dryRun: false,
          created: 0,
          updated: 0,
          failed: 1,
          rows: [{ row: 3, status: 'failed', error: 'Falta' }],
        }),
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    const crear = vi.fn(() => 'blob:prueba')
    const revocar = vi.fn()
    URL.createObjectURL = crear
    URL.revokeObjectURL = revocar
    const clic = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    const { container } = pintar('ADMIN')
    await elegirArchivo(container)
    fireEvent.click(await screen.findByRole('button', { name: 'Simular' }))
    fireEvent.click(
      await screen.findByRole('button', { name: 'Confirmar importación' }),
    )
    await screen.findByRole('button', { name: 'Importar otro archivo' })
    fireEvent.click(
      screen.getByRole('button', { name: 'Descargar errores (CSV)' }),
    )
    await waitFor(() => expect(clic).toHaveBeenCalledTimes(1))
    expect(crear).toHaveBeenCalledTimes(1)
    expect(revocar).toHaveBeenCalledWith('blob:prueba')
    expect(String(fetchMock.mock.calls[2][0])).toContain(
      '/catalog/imports/id-1/errors',
    )
    clic.mockRestore()
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
    await elegirArchivo(container)
    fireEvent.click(await screen.findByRole('button', { name: 'Simular' }))
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
      await screen.findByRole('heading', { name: 'Iniciar sesión' }),
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

  it('decodifica archivos Windows-1252 de Excel antes de enviarlos y muestra el límite de 1 MB', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ created: 1, updated: 0, failed: 0, rows: [] }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { container } = pintar('ADMIN')

    // "Título;Año" en Windows-1252 (í=0xED, ñ=0xF1)
    const win1252Bytes = new Uint8Array([
      0x54, 0xed, 0x74, 0x75, 0x6c, 0x6f, 0x3b, 0x41, 0xf1, 0x6f,
    ])
    const archivoWin = new File([win1252Bytes], 'excel.csv', {
      type: 'text/csv',
    })
    Object.defineProperty(archivoWin, 'arrayBuffer', {
      value: async () => win1252Bytes.buffer,
    })

    await screen.findByRole('button', { name: 'Simular' })
    const input = container.querySelector('input[type="file"]')
    if (!input) throw new Error('Falta el selector de archivo')

    fireEvent.change(input, { target: { files: [archivoWin] } })
    fireEvent.click(screen.getByRole('button', { name: 'Simular' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [, options] = fetchMock.mock.calls[0]
    expect(JSON.parse(options.body)).toEqual({
      content: 'Título;Año',
      fileName: 'excel.csv',
    })

    const archivoGrande = new File(['x'], 'grande.csv', { type: 'text/csv' })
    Object.defineProperty(archivoGrande, 'size', { value: 1_000_001 })
    fireEvent.change(input, { target: { files: [archivoGrande] } })
    fireEvent.click(screen.getByRole('button', { name: 'Simular' }))

    expect(await screen.findByRole('alert')).toBeDefined()
    expect(screen.getByRole('alert').textContent).toContain('1 MB')
  })
})
