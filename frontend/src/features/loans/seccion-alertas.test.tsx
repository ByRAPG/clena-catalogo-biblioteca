import { MantineProvider } from '@mantine/core'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../shared/api/client'
import * as busqueda from '../search/busqueda.api'
import * as api from './alertas.api'
import { SeccionAlertas } from './seccion-alertas'

vi.mock('./alertas.api')
vi.mock('../search/busqueda.api')

const PANEL: api.PanelAlertas = {
  loans: [
    {
      loanId: 'l1',
      type: 'VENCIDO',
      dueAt: '2026-11-20T15:00:00.000Z',
      inventoryCode: 'CLENA-0001-1',
      workTitle: 'Cien años de soledad',
      readerName: 'Carmen Pérez',
      readerEmail: 'carmen@example.org',
      notifiedAt: '2026-11-21T15:00:00.000Z',
      notifyError: null,
    },
    {
      loanId: 'l2',
      type: 'POR_VENCER',
      dueAt: '2026-11-27T15:00:00.000Z',
      inventoryCode: 'CLENA-0002-1',
      workTitle: 'María',
      readerName: 'Luis Gómez',
      readerEmail: null,
      notifiedAt: null,
      notifyError: 'El lector no tiene correo registrado',
    },
  ],
  availability: [],
}

const LECTORES = [
  {
    id: 'r1',
    fullName: 'Carmen Pérez',
    documentId: null,
    email: 'carmen@example.org',
    phone: null,
  },
]

beforeAll(() => {
  Element.prototype.scrollIntoView ??= vi.fn()
})

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.obtenerAlertas).mockResolvedValue(PANEL)
})

function pintar() {
  return render(
    <MantineProvider env="test">
      <SeccionAlertas token="token-staff" lectores={LECTORES} />
    </MantineProvider>,
  )
}

const usuario = () => userEvent.setup({ delay: null })

describe('Alertas de devolución (HU-21)', () => {
  it('muestra el vencido primero y marca «Por vencer» con texto', async () => {
    pintar()
    const tabla = await screen.findByRole('table', {
      name: 'Préstamos vencidos y por vencer',
    })
    const filas = within(tabla).getAllByRole('row').slice(1)
    expect(within(filas[0]).getByText('Vencido')).toBeDefined()
    expect(within(filas[0]).getByText('Cien años de soledad')).toBeDefined()
    expect(within(filas[1]).getByText('Por vencer')).toBeDefined()
    expect(
      within(filas[1]).getByText('El lector no tiene correo registrado'),
    ).toBeDefined()
    expect(api.obtenerAlertas).toHaveBeenCalledWith(
      'token-staff',
      expect.anything(),
    )
  })

  it('corre la revisión y dice cuántos correos salieron', async () => {
    vi.mocked(api.correrRevision).mockResolvedValue({
      reminders: { sent: 2, failed: 0, withoutEmail: 1, alreadySent: 0 },
      availability: { sent: 1, failed: 0 },
    })
    pintar()
    await usuario().click(
      screen.getByRole('button', { name: 'Revisar y enviar avisos ahora' }),
    )
    expect((await screen.findByRole('status')).textContent).toContain(
      '3 correos enviados',
    )
    expect(api.correrRevision).toHaveBeenCalledWith('token-staff')
  }, 15000)

  it('registra «Avísame cuando esté disponible»', async () => {
    vi.mocked(busqueda.buscarObras).mockResolvedValue({
      data: [{ id: 'w1', title: 'María' } as busqueda.ObraResumen],
      meta: { page: 1, pageSize: 10, total: 1 },
    })
    vi.mocked(api.pedirAvisoDisponibilidad).mockResolvedValue({
      id: 'a1',
      createdAt: '2026-11-26T15:00:00.000Z',
      workId: 'w1',
      workTitle: 'María',
      readerName: 'Carmen Pérez',
      readerEmail: 'carmen@example.org',
    })
    pintar()
    const u = usuario()
    await u.click(
      screen.getByLabelText('Lector que espera el libro', { selector: 'input' }),
    )
    await u.click(
      await screen.findByRole(
        'option',
        { name: 'Carmen Pérez · carmen@example.org' },
        { timeout: 5000 },
      ),
    )
    await u.type(
      screen.getByLabelText('Buscar el libro por título', { selector: 'input' }),
      'maria',
    )
    await u.click(screen.getByRole('button', { name: 'Buscar libro' }))
    expect(await screen.findByDisplayValue('María')).toBeDefined()

    await u.click(screen.getByRole('button', { name: 'Registrar aviso' }))

    expect(api.pedirAvisoDisponibilidad).toHaveBeenCalledWith(
      'r1',
      'w1',
      'token-staff',
    )
    expect(
      await screen.findByText(
        'Listo: avisaremos a Carmen Pérez cuando «María» esté disponible.',
      ),
    ).toBeDefined()
  }, 15000)

  it('muestra el error del servidor si el libro ya está disponible', async () => {
    vi.mocked(busqueda.buscarObras).mockResolvedValue({
      data: [{ id: 'w1', title: 'María' } as busqueda.ObraResumen],
      meta: { page: 1, pageSize: 10, total: 1 },
    })
    vi.mocked(api.pedirAvisoDisponibilidad).mockRejectedValue(
      new ApiError(
        'El libro ya tiene un ejemplar disponible; puede prestarlo ahora',
        409,
        '/loans/availability-alerts',
      ),
    )
    pintar()
    const u = usuario()
    await u.click(
      screen.getByLabelText('Lector que espera el libro', { selector: 'input' }),
    )
    await u.click(
      await screen.findByRole(
        'option',
        { name: 'Carmen Pérez · carmen@example.org' },
        { timeout: 5000 },
      ),
    )
    await u.type(
      screen.getByLabelText('Buscar el libro por título', { selector: 'input' }),
      'maria',
    )
    await u.click(screen.getByRole('button', { name: 'Buscar libro' }))
    await screen.findByDisplayValue('María')
    await u.click(screen.getByRole('button', { name: 'Registrar aviso' }))

    expect((await screen.findByRole('alert')).textContent).toContain(
      'ya tiene un ejemplar disponible',
    )
  }, 15000)

  it('pide elegir lector y libro antes de enviar', async () => {
    pintar()
    await usuario().click(screen.getByRole('button', { name: 'Registrar aviso' }))
    expect(await screen.findByText('Elija el lector y el libro.')).toBeDefined()
    expect(api.pedirAvisoDisponibilidad).not.toHaveBeenCalled()
  }, 15000)
})
