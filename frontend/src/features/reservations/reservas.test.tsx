import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../shared/api/client'
import { SesionContext, type Sesion } from '../auth/sesion-context'
import { BotonReservar } from './boton-reservar'
import { MisReservas } from './mis-reservas'
import * as api from './reservas.api'

vi.mock('./reservas.api')

const reserva: api.Reserva = {
  id: 'r-1',
  workId: 'w-1',
  workTitle: 'Cien años de soledad',
  inventoryCode: 'CLENA-0001-1',
  reservedAt: '2026-11-27T10:00:00.000Z',
  expiresAt: '2026-11-29T10:00:00.000Z',
}

function conSesion(sesion: Sesion | null, ui: React.ReactNode) {
  return render(
    <MantineProvider>
      <SesionContext.Provider
        value={{
          sesion,
          recuperando: false,
          iniciarSesion: vi.fn(),
          cerrarSesion: vi.fn(),
        }}
      >
        <MemoryRouter>{ui}</MemoryRouter>
      </SesionContext.Provider>
    </MantineProvider>,
  )
}

const lector: Sesion = { token: 'tok', nombre: 'Ana', rol: 'READER' }

describe('BotonReservar (HU-14)', () => {
  beforeEach(() => vi.resetAllMocks())

  it('un lector reserva y ve el plazo', async () => {
    vi.mocked(api.reservarObra).mockResolvedValue(reserva)
    conSesion(lector, <BotonReservar workId="w-1" disponibles={1} />)
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))
    expect(api.reservarObra).toHaveBeenCalledWith('w-1', 'tok')
    expect(await screen.findByText(/Reservamos el ejemplar CLENA-0001-1/)).toBeTruthy()
  })

  it('muestra el conflicto del servidor', async () => {
    vi.mocked(api.reservarObra).mockRejectedValue(
      new ApiError('Ya tiene una reserva activa de esta obra', 409, '/reservations'),
    )
    conSesion(lector, <BotonReservar workId="w-1" disponibles={1} />)
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/reserva activa/)
  })

  it('sin sesión invita a ingresar; el personal y las obras sin copias no ven el botón', () => {
    const { unmount } = conSesion(null, <BotonReservar workId="w-1" disponibles={1} />)
    expect(screen.getByRole('link', { name: 'ingrese' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Reservar' })).toBeNull()
    unmount()
    const staff = conSesion(
      { token: 't', nombre: 'S', rol: 'STAFF' },
      <BotonReservar workId="w-1" disponibles={1} />,
    )
    expect(screen.queryByRole('button', { name: 'Reservar' })).toBeNull()
    staff.unmount()
    conSesion(lector, <BotonReservar workId="w-1" disponibles={0} />)
    expect(screen.queryByRole('button', { name: 'Reservar' })).toBeNull()
  })
})

describe('MisReservas (HU-14)', () => {
  beforeEach(() => vi.resetAllMocks())

  it('lista las reservas con plazo y permite cancelar', async () => {
    vi.mocked(api.listarMisReservas)
      .mockResolvedValueOnce([reserva])
      .mockResolvedValueOnce([])
    vi.mocked(api.cancelarReserva).mockResolvedValue(undefined)
    conSesion(lector, <MisReservas token="tok" />)
    expect(await screen.findByText('Cien años de soledad')).toBeTruthy()
    expect(screen.getByText(/recoger antes del/)).toBeTruthy()
    await userEvent.click(
      screen.getByRole('button', { name: /Cancelar la reserva de Cien/ }),
    )
    expect(api.cancelarReserva).toHaveBeenCalledWith('r-1', 'tok')
    await waitFor(() =>
      expect(screen.getByText(/No tiene reservas activas/)).toBeTruthy(),
    )
  })
})
