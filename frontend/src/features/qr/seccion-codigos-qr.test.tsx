import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiUrl } from '../../shared/api/client'
import { theme } from '../../shared/theme/theme'
import { SesionContext, type Sesion } from '../auth/sesion-context'
import { nombreDeArchivoQr } from './descargar-qr'
import { SeccionCodigosQr } from './seccion-codigos-qr'

const SALA_A = '5b0f7d4e-1c1e-5a53-a3f1-0d7f4a2c9e11'
const SALA_B = '6c1a8e5f-2d2f-5b64-b4a2-1e8a5b3d0f22'
const PERSONAL: Sesion = { token: 'token-de-prueba', nombre: 'Personal', rol: 'STAFF' }
const SALAS = {
  data: [
    { id: SALA_A, name: 'Sala de Lectura' },
    { id: SALA_B, name: 'Sala Infantil' },
  ],
}

function json(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  })
}

function imagen(): Response {
  // Cuerpo en texto: el Blob de jsdom no sirve como cuerpo del Response de Node.
  return new Response('png', {
    status: 200,
    headers: { 'Content-Type': 'image/png' },
  })
}

function pintar(sesion: Sesion | null = PERSONAL) {
  return render(
    <MantineProvider theme={theme} env="test" defaultColorScheme="light">
      <SesionContext.Provider
        value={{ sesion, recuperando: false, iniciarSesion: vi.fn(), cerrarSesion: vi.fn() }}
      >
        <SeccionCodigosQr />
      </SesionContext.Provider>
    </MantineProvider>,
  )
}

beforeEach(() => {
  // jsdom no implementa las URL de objetos ni la descarga por enlace.
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:qr'),
    revokeObjectURL: vi.fn(),
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('SeccionCodigosQr', () => {
  it('muestra la carga, el enlace público de entrada y un botón por sala', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(SALAS)))
    pintar()

    expect(screen.getByText('Cargando salas…')).toBeDefined()
    expect(
      await screen.findByRole('button', {
        name: 'Descargar QR de Sala de Lectura',
      }),
    ).toBeDefined()
    expect(
      screen.getByRole('button', { name: 'Descargar QR de Sala Infantil' }),
    ).toBeDefined()
    expect(
      screen
        .getByRole('link', { name: 'Descargar QR de entrada' })
        .getAttribute('href'),
    ).toBe(`${apiUrl}/rooms/qr`)
  })

  it('pide el QR de la sala con el token de la sesión y lo guarda como archivo', async () => {
    const simulada = vi
      .fn()
      .mockResolvedValueOnce(json(SALAS))
      .mockResolvedValueOnce(imagen())
    vi.stubGlobal('fetch', simulada)
    pintar()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Descargar QR de Sala de Lectura',
      }),
    )

    await waitFor(() =>
      expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1),
    )
    const [url, opciones] = simulada.mock.calls[1] as [string, RequestInit]
    expect(url).toBe(`${apiUrl}/rooms/${SALA_A}/qr`)
    expect(new Headers(opciones.headers).get('Authorization')).toBe(
      'Bearer token-de-prueba',
    )
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('avisa junto al botón cuando la sesión venció', async () => {
    const simulada = vi
      .fn()
      .mockResolvedValueOnce(json(SALAS))
      .mockResolvedValueOnce(json({ statusCode: 401 }, 401))
    vi.stubGlobal('fetch', simulada)
    pintar()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Descargar QR de Sala Infantil',
      }),
    )

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Su sesión venció',
    )
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled()
  })

  it('sin sesión no llama a la API y pide ingresar', async () => {
    const simulada = vi.fn().mockResolvedValue(json(SALAS))
    vi.stubGlobal('fetch', simulada)
    pintar(null)

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Descargar QR de Sala de Lectura',
      }),
    )

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Ingrese con su cuenta',
    )
    expect(simulada).toHaveBeenCalledTimes(1)
  })

  it('avisa cuando no hay salas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ data: [] })))
    pintar()

    expect(
      await screen.findByText('Todavía no hay salas registradas.'),
    ).toBeDefined()
    expect(
      screen.getByRole('link', { name: 'Descargar QR de entrada' }),
    ).toBeDefined()
  })

  it('muestra el error de carga y permite reintentar', async () => {
    const simulada = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('red caída'))
      .mockResolvedValueOnce(
        json({ data: [{ id: SALA_A, name: 'Sala de Lectura' }] }),
      )
    vi.stubGlobal('fetch', simulada)
    pintar()

    expect(await screen.findByRole('alert')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(
      await screen.findByRole('button', {
        name: 'Descargar QR de Sala de Lectura',
      }),
    ).toBeDefined()
    expect(simulada).toHaveBeenCalledTimes(2)
  })
})

describe('nombreDeArchivoQr', () => {
  it('quita tildes y espacios del nombre de la sala', () => {
    expect(nombreDeArchivoQr('Sala Caribe')).toBe('qr-sala-caribe.png')
    expect(nombreDeArchivoQr('Colección Niños')).toBe('qr-coleccion-ninos.png')
    expect(nombreDeArchivoQr('···')).toBe('qr-sala.png')
  })
})
