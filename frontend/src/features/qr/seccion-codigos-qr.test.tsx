import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiUrl } from '../../shared/api/client'
import { theme } from '../../shared/theme/theme'
import { SeccionCodigosQr } from './seccion-codigos-qr'

const SALA_A = '5b0f7d4e-1c1e-5a53-a3f1-0d7f4a2c9e11'
const SALA_B = '6c1a8e5f-2d2f-5b64-b4a2-1e8a5b3d0f22'

function json(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  })
}

function pintar() {
  return render(
    <MantineProvider theme={theme} env="test" defaultColorScheme="light">
      <SeccionCodigosQr />
    </MantineProvider>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SeccionCodigosQr', () => {
  it('muestra la carga y luego un enlace de descarga por sala', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        json({
          data: [
            { id: SALA_A, name: 'Sala de Lectura' },
            { id: SALA_B, name: 'Sala Infantil' },
          ],
        }),
      ),
    )
    pintar()

    expect(screen.getByText('Cargando salas…')).toBeDefined()

    const enlaceA = await screen.findByRole('link', {
      name: 'Descargar QR de Sala de Lectura',
    })
    expect(enlaceA.getAttribute('href')).toBe(`${apiUrl}/rooms/${SALA_A}/qr`)
    expect(
      screen
        .getByRole('link', { name: 'Descargar QR de Sala Infantil' })
        .getAttribute('href'),
    ).toBe(`${apiUrl}/rooms/${SALA_B}/qr`)
    expect(
      screen
        .getByRole('link', { name: 'Descargar QR de entrada' })
        .getAttribute('href'),
    ).toBe(`${apiUrl}/rooms/qr`)
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

  it('muestra el error y permite reintentar', async () => {
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
      await screen.findByRole('link', {
        name: 'Descargar QR de Sala de Lectura',
      }),
    ).toBeDefined()
    expect(simulada).toHaveBeenCalledTimes(2)
  })
})
