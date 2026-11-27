import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SesionContext } from '../auth/sesion-context'
import { PaginaUsuarios } from './pagina-usuarios'
import * as api from './usuarios.api'

vi.mock('./usuarios.api')

const cuenta: api.CuentaPersonal = {
  id: 'u-1',
  fullName: 'Marta Pérez',
  email: 'marta@example.org',
  role: 'STAFF',
  active: true,
  createdAt: '2026-11-26T12:00:00.000Z',
}

function renderPagina() {
  return render(
    <MantineProvider>
      <SesionContext.Provider
        value={{
          sesion: { token: 'tok', nombre: 'Admin', rol: 'ADMIN' },
          recuperando: false,
          iniciarSesion: vi.fn(),
          cerrarSesion: vi.fn(),
        }}
      >
        <MemoryRouter>
          <PaginaUsuarios />
        </MemoryRouter>
      </SesionContext.Provider>
    </MantineProvider>,
  )
}

async function llenarFormulario() {
  await userEvent.type(screen.getByLabelText(/Nombre completo/), 'Luis Gómez')
  await userEvent.type(screen.getByLabelText(/Correo/), 'luis@example.org')
  await userEvent.type(
    screen.getByLabelText(/Contraseña inicial/),
    'una-clave-larga-1',
  )
  await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
}

describe('PaginaUsuarios (HU-18)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(api.listarCuentas).mockResolvedValue([cuenta])
  })

  it('lista las cuentas y desactiva una', async () => {
    vi.mocked(api.cambiarEstadoCuenta).mockResolvedValue(undefined)
    renderPagina()
    expect(await screen.findByText('marta@example.org')).toBeTruthy()
    await userEvent.click(
      screen.getByRole('button', { name: /Desactivar la cuenta de Marta/ }),
    )
    expect(api.cambiarEstadoCuenta).toHaveBeenCalledWith('u-1', false, 'tok')
  })

  it('crea una cuenta y muestra el aviso', async () => {
    vi.mocked(api.crearCuenta).mockResolvedValue({ id: 'u-2' })
    renderPagina()
    await screen.findByText('marta@example.org')
    await llenarFormulario()
    await waitFor(() =>
      expect(api.crearCuenta).toHaveBeenCalledWith(
        {
          fullName: 'Luis Gómez',
          email: 'luis@example.org',
          password: 'una-clave-larga-1',
        },
        'tok',
      ),
    )
    expect(await screen.findByText(/Cuenta creada para luis@example.org/)).toBeTruthy()
  })

  it('muestra el error del servidor', async () => {
    vi.mocked(api.crearCuenta).mockRejectedValue(
      new Error('Ya existe una cuenta con ese correo'),
    )
    renderPagina()
    await screen.findByText('marta@example.org')
    await llenarFormulario()
    expect((await screen.findByRole('alert')).textContent).toMatch(/Ya existe una cuenta/)
  })
})
