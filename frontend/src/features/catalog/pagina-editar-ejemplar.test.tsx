import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../shared/api/client'
import { SesionContext } from '../auth/sesion-context'
import * as prestamos from '../loans/prestamos.api'
import * as api from './ejemplares.api'
import { PaginaEditarEjemplar } from './pagina-editar-ejemplar'

vi.mock('../loans/prestamos.api')
// Solo se simulan las llamadas a la API; rotuloEstante es la real.
vi.mock('./ejemplares.api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./ejemplares.api')>()),
  listarEstantes: vi.fn(),
  actualizarEjemplar: vi.fn(),
}))

const EJEMPLAR: prestamos.EjemplarParaPrestamo = {
  id: 'copy-1',
  inventoryCode: 'CLENA-0001-1',
  status: 'DISPONIBLE',
  workId: 'work-1',
  workTitle: 'Cien años de soledad',
  room: 'Sala General',
  section: 'Narrativa',
  shelf: 'A-01',
  hasActiveReservation: false,
}

const ESTANTES: api.Estante[] = [
  { id: 's1', code: 'A-01', section: 'Narrativa', room: 'Sala General' },
  { id: 's2', code: 'B-02', section: 'Historia', room: 'Sala Norte' },
]

beforeAll(() => {
  // jsdom no implementa scrollIntoView y el desplegable de Mantine lo usa.
  Element.prototype.scrollIntoView ??= vi.fn()
})

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.listarEstantes).mockResolvedValue(ESTANTES)
  vi.mocked(prestamos.buscarEjemplares).mockResolvedValue([EJEMPLAR])
})

function pintar() {
  return render(
    <MantineProvider env="test">
      <SesionContext.Provider
        value={{
          sesion: { token: 'token-staff', nombre: 'Marta', rol: 'STAFF' },
          recuperando: false,
          iniciarSesion: vi.fn(),
          cerrarSesion: vi.fn(),
        }}
      >
        <MemoryRouter>
          <PaginaEditarEjemplar />
        </MemoryRouter>
      </SesionContext.Provider>
    </MantineProvider>,
  )
}

const usuario = () => userEvent.setup({ delay: null })
const campo = (nombre: string) =>
  screen.getByLabelText(nombre, { selector: 'input' })

/** Busca el ejemplar de prueba y abre su edición. */
async function abrirEdicion() {
  const u = usuario()
  await u.type(campo('Código de inventario o título'), 'CLENA-0001')
  await u.click(screen.getByRole('button', { name: 'Buscar' }))
  await u.click(
    await screen.findByRole('button', { name: 'Editar CLENA-0001-1' }),
  )
  await screen.findByRole('heading', { name: '2. Editar CLENA-0001-1' })
  // Espera a que el estante actual quede preseleccionado.
  await waitFor(() =>
    expect((campo('Estante') as HTMLInputElement).value).toBe(
      'Sala General › Narrativa › A-01',
    ),
  )
}

async function elegirOpcion(etiqueta: string, opcion: string) {
  const u = usuario()
  await u.click(campo(etiqueta))
  await u.click(
    await screen.findByRole('option', { name: opcion }, { timeout: 5000 }),
  )
}

const guardar = () =>
  usuario().click(screen.getByRole('button', { name: 'Guardar cambios' }))

describe('Editar ubicación y estado de un ejemplar (HU-11)', () => {
  it('busca ejemplares con el token y muestra su ubicación', async () => {
    pintar()
    await abrirEdicion()
    expect(prestamos.buscarEjemplares).toHaveBeenCalledWith(
      'CLENA-0001',
      'token-staff',
    )
    expect(api.listarEstantes).toHaveBeenCalledWith(
      'token-staff',
      expect.anything(),
    )
    expect((campo('Estado') as HTMLInputElement).value).toBe('Disponible')
  }, 15000)

  it('marca el ejemplar en mantenimiento y muestra el resultado', async () => {
    vi.mocked(api.actualizarEjemplar).mockResolvedValue({
      id: 'copy-1',
      inventoryCode: 'CLENA-0001-1',
      status: 'MANTENIMIENTO',
      shelfId: 's1',
      shelf: 'A-01',
      section: 'Narrativa',
      room: 'Sala General',
    })
    pintar()
    await abrirEdicion()

    await elegirOpcion('Estado', 'En mantenimiento')
    await guardar()

    expect(api.actualizarEjemplar).toHaveBeenCalledWith(
      'copy-1',
      { status: 'MANTENIMIENTO' },
      'token-staff',
    )
    expect((await screen.findByRole('status')).textContent).toContain(
      'Ejemplar CLENA-0001-1 actualizado: Sala General › Narrativa › A-01 · En mantenimiento.',
    )
    const fila = screen.getByRole('row', { name: /CLENA-0001-1/ })
    expect(within(fila).getByText('En mantenimiento')).toBeDefined()
  }, 15000)

  it('cambia solo el estante si solo cambia el estante', async () => {
    vi.mocked(api.actualizarEjemplar).mockResolvedValue({
      id: 'copy-1',
      inventoryCode: 'CLENA-0001-1',
      status: 'DISPONIBLE',
      shelfId: 's2',
      shelf: 'B-02',
      section: 'Historia',
      room: 'Sala Norte',
    })
    pintar()
    await abrirEdicion()

    await elegirOpcion('Estante', 'Sala Norte › Historia › B-02')
    await guardar()

    expect(api.actualizarEjemplar).toHaveBeenCalledWith(
      'copy-1',
      { shelfId: 's2' },
      'token-staff',
    )
    expect((await screen.findByRole('status')).textContent).toContain(
      'Sala Norte › Historia › B-02',
    )
  }, 15000)

  it('no envía nada si no hay cambios', async () => {
    pintar()
    await abrirEdicion()

    await guardar()

    expect(
      await screen.findByText('Cambie el estante o el estado antes de guardar.'),
    ).toBeDefined()
    expect(api.actualizarEjemplar).not.toHaveBeenCalled()
  }, 15000)

  it('muestra el 409 del servidor si el ejemplar está prestado', async () => {
    vi.mocked(api.actualizarEjemplar).mockRejectedValue(
      new ApiError(
        'El ejemplar está prestado; regístrelo como devuelto primero',
        409,
        '/catalog/copies/copy-1',
      ),
    )
    pintar()
    await abrirEdicion()

    await elegirOpcion('Estado', 'Dado de baja')
    await guardar()

    expect((await screen.findByRole('alert')).textContent).toContain(
      'El ejemplar está prestado; regístrelo como devuelto primero',
    )
    expect(screen.queryByRole('status')).toBeNull()
  }, 15000)

  it('avisa cuando la búsqueda no encuentra ejemplares', async () => {
    vi.mocked(prestamos.buscarEjemplares).mockResolvedValue([])
    pintar()
    const u = usuario()
    await u.type(campo('Código de inventario o título'), 'nada')
    await u.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(
      await screen.findByText(
        'No se encontraron ejemplares con ese código o título.',
      ),
    ).toBeDefined()
  }, 15000)
})