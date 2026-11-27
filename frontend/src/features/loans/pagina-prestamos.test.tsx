import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SesionContext } from '../auth/sesion-context'
import { PaginaPrestamos } from './pagina-prestamos'
import * as api from './prestamos.api'

vi.mock('./prestamos.api')
// El panel de alertas (HU-21) tiene su propia prueba.
vi.mock('./alertas.api')

const prestamoActivo: api.Prestamo = {
  id: 'loan-1',
  loanedAt: '2026-11-25T15:00:00.000Z',
  dueAt: '2026-12-10T15:00:00.000Z',
  returnedAt: null,
  active: true,
  overdue: false,
  copy: {
    id: 'copy-1',
    inventoryCode: 'CLENA-0001-1',
    status: 'PRESTADO',
    workId: 'work-1',
    workTitle: 'Cien años de soledad',
    room: 'Sala General',
    section: 'Narrativa',
    shelf: 'E-01',
  },
  reader: {
    id: 'reader-1',
    fullName: 'Carmen Pérez',
    documentId: '1045000111',
    email: 'carmen@example.org',
  },
  staff: { id: 'staff-1', fullName: 'Marta' },
}

function renderPagina() {
  return render(
    <MantineProvider>
      <SesionContext.Provider
        value={{
          sesion: {
            token: 'token-staff',
            nombre: 'Marta',
            rol: 'STAFF',
          },
          recuperando: false,
          iniciarSesion: vi.fn(),
          cerrarSesion: vi.fn(),
        }}
      >
        <MemoryRouter>
          <PaginaPrestamos />
        </MemoryRouter>
      </SesionContext.Provider>
    </MantineProvider>,
  )
}

describe('PaginaPrestamos (HU-20)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(api.buscarEjemplares).mockResolvedValue([
      {
        id: 'copy-1',
        inventoryCode: 'CLENA-0001-1',
        status: 'DISPONIBLE',
        workId: 'work-1',
        workTitle: 'Cien años de soledad',
        room: 'Sala General',
        section: 'Narrativa',
        shelf: 'E-01',
        hasActiveReservation: false,
      },
    ])
    vi.mocked(api.buscarLectores).mockResolvedValue([
      {
        id: 'reader-1',
        fullName: 'Carmen Pérez',
        documentId: '1045000111',
        email: 'carmen@example.org',
        phone: null,
      },
    ])
    vi.mocked(api.listarPrestamos).mockResolvedValue({
      data: [prestamoActivo],
      total: 1,
      page: 1,
      pageSize: 50,
    })
  })

  it('muestra préstamos activos y permite registrar una devolución', async () => {
    vi.mocked(api.devolverPrestamo).mockResolvedValue({
      ...prestamoActivo,
      active: false,
      returnedAt: '2026-11-26T10:00:00.000Z',
      copy: { ...prestamoActivo.copy, status: 'DISPONIBLE' },
    })

    const user = userEvent.setup()
    renderPagina()

    expect(
      await screen.findByText('Cien años de soledad'),
    ).toBeTruthy()
    expect(screen.getByText('Carmen Pérez')).toBeTruthy()

    await user.click(
      screen.getByRole('button', { name: 'Registrar devolución' }),
    )

    await waitFor(() => {
      expect(api.devolverPrestamo).toHaveBeenCalledWith('loan-1', 'token-staff')
    })
    expect(
      await screen.findByText(/vuelve a estar disponible/i),
    ).toBeTruthy()
  })

  it('muestra un mensaje claro si el ejemplar ya está prestado', async () => {
    vi.mocked(api.registrarPrestamo).mockRejectedValue(
      new Error('El ejemplar ya se encuentra prestado'),
    )

    const user = userEvent.setup()
    renderPagina()

    await screen.findByText('Cien años de soledad')

    await user.type(
      screen.getByLabelText('O ingrese el código de inventario'),
      'CLENA-0001-1',
    )
    await user.click(screen.getByPlaceholderText('Seleccione un lector'))
    await user.click(await screen.findByText(/Carmen Pérez · Doc\. 1045000111/))

    await user.click(
      screen.getByRole('button', { name: 'Registrar préstamo' }),
    )

    expect(
      await screen.findByText('El ejemplar ya se encuentra prestado'),
    ).toBeTruthy()
  })
})
