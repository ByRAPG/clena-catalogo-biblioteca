import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../shared/api/client'
import * as busqueda from '../search/busqueda.api'
import * as api from './ejemplares.api'
import { SeccionNuevoEjemplar } from './seccion-nuevo-ejemplar'

vi.mock('../search/busqueda.api')
vi.mock('./ejemplares.api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./ejemplares.api')>()),
  registrarEjemplar: vi.fn(),
}))

const ESTANTES: api.Estante[] = [
  { id: 's1', code: 'A-01', section: 'Narrativa', room: 'Sala General' },
  { id: 's2', code: 'B-02', section: 'Historia', room: 'Sala Norte' },
]

beforeAll(() => {
  Element.prototype.scrollIntoView ??= vi.fn()
})

beforeEach(() => {
  vi.resetAllMocks()
})

function pintar(ruta = '/gestion/ejemplares?obra=11111111-1111-4111-8111-111111111111&titulo=Cien%20a%C3%B1os%20de%20soledad') {
  return render(
    <MantineProvider env="test">
      <MemoryRouter initialEntries={[ruta]}>
        <SeccionNuevoEjemplar estantes={ESTANTES} token="token-staff" />
      </MemoryRouter>
    </MantineProvider>,
  )
}

const usuario = () => userEvent.setup({ delay: null })
const campo = (nombre: string) =>
  screen.getByLabelText(new RegExp(`^${nombre}`), { selector: 'input' })

async function elegir(etiqueta: string, opcion: string) {
  const u = usuario()
  await u.click(campo(etiqueta))
  await u.click(
    await screen.findByRole('option', { name: opcion }, { timeout: 5000 }),
  )
}

const registrar = () =>
  usuario().click(screen.getByRole('button', { name: 'Registrar ejemplar' }))

describe('Registrar un ejemplar (HU-19)', () => {
  it('trae elegido el libro que viene de «Libro registrado»', () => {
    pintar()
    expect((campo('Libro') as HTMLInputElement).value).toBe(
      'Cien años de soledad',
    )
  })

  it('muestra los errores junto a cada campo y no envía', async () => {
    pintar('/gestion/ejemplares')
    await registrar()
    expect(await screen.findByText('Busque y elija el libro')).toBeDefined()
    expect(screen.getByText('Escriba el código de inventario')).toBeDefined()
    expect(screen.getByText('Elija sala, sección y estante')).toBeDefined()
    expect(api.registrarEjemplar).not.toHaveBeenCalled()
  }, 15000)

  it('registra el ejemplar con su estante y muestra dónde quedó', async () => {
    vi.mocked(api.registrarEjemplar).mockResolvedValue({
      id: 'c9',
      inventoryCode: 'CLENA-0042-1',
      status: 'DISPONIBLE',
      shelfId: 's2',
      shelf: 'B-02',
      section: 'Historia',
      room: 'Sala Norte',
    })
    pintar()
    await usuario().type(campo('Código de inventario'), 'CLENA-0042-1')
    await elegir('Ubicación', 'Sala Norte › Historia › B-02')
    await registrar()

    expect(api.registrarEjemplar).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      { inventoryCode: 'CLENA-0042-1', shelfId: 's2', status: 'DISPONIBLE' },
      'token-staff',
    )
    const aviso = await screen.findByRole('status')
    expect(aviso.textContent).toContain(
      'CLENA-0042-1 de «Cien años de soledad» quedó en Sala Norte › Historia › B-02.',
    )
    expect((campo('Código de inventario') as HTMLInputElement).value).toBe('')
  }, 15000)

  it('muestra el 409 si el código ya existe', async () => {
    vi.mocked(api.registrarEjemplar).mockRejectedValue(
      new ApiError(
        'El código de inventario «CLENA-0001-1» ya está registrado',
        409,
        '/catalog/works/11111111-1111-4111-8111-111111111111/copies',
      ),
    )
    pintar()
    await usuario().type(campo('Código de inventario'), 'CLENA-0001-1')
    await elegir('Ubicación', 'Sala General › Narrativa › A-01')
    await registrar()

    expect((await screen.findByRole('alert')).textContent).toContain(
      'ya está registrado',
    )
    expect(screen.queryByRole('status')).toBeNull()
  }, 15000)

  it('busca el libro por título', async () => {
    vi.mocked(busqueda.buscarObras).mockResolvedValue({
      data: [{ id: 'w7', title: 'María' } as busqueda.ObraResumen],
      meta: { page: 1, pageSize: 10, total: 1 },
    })
    pintar('/gestion/ejemplares')
    await usuario().type(campo('Buscar el libro por título'), 'maria')
    await usuario().click(screen.getByRole('button', { name: 'Buscar libro' }))

    expect(busqueda.buscarObras).toHaveBeenCalledWith({ q: 'maria' })
    expect(await screen.findByDisplayValue('María')).toBeDefined()
  }, 15000)
})
