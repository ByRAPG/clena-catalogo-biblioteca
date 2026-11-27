import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../shared/api/client'
import { SesionContext } from '../auth/sesion-context'
import * as api from './cuenta.api'
import { PaginaMiCuenta } from './pagina-mi-cuenta'
import { PaginaRegistro } from './pagina-registro'

vi.mock('./cuenta.api')

function conSesion(
  ui: React.ReactNode,
  sesion: { token: string; nombre: string; rol: 'READER' } | null,
  acciones: { iniciarSesion?: () => Promise<void>; cerrarSesion?: () => Promise<void> } = {},
) {
  return render(
    <MantineProvider>
      <SesionContext.Provider
        value={{
          sesion,
          recuperando: false,
          iniciarSesion: acciones.iniciarSesion ?? vi.fn(),
          cerrarSesion: acciones.cerrarSesion ?? vi.fn(),
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route path="*" element={ui} />
          </Routes>
        </MemoryRouter>
      </SesionContext.Provider>
    </MantineProvider>,
  )
}

const lector = { token: 'tok', nombre: 'Carmen', rol: 'READER' as const }

async function llenarRegistro() {
  await userEvent.type(screen.getByLabelText(/Nombre completo/), 'Carmen Pérez')
  await userEvent.type(screen.getByLabelText(/^Correo/), 'carmen@example.org')
  await userEvent.type(screen.getByLabelText(/^Contraseña/), 'una-clave-larga-1')
}

describe('PaginaRegistro (HU-16)', () => {
  beforeEach(() => vi.resetAllMocks())

  it('no permite enviar sin aceptar el aviso y enlaza a /privacidad', () => {
    conSesion(<PaginaRegistro />, null)
    const boton = screen.getByRole('button', { name: 'Crear cuenta' })
    expect((boton as HTMLButtonElement).disabled).toBe(true)
    const enlace = screen.getByRole('link', { name: /aviso de privacidad/i })
    expect(enlace.getAttribute('href')).toBe('/privacidad')
  })

  it('registra con acceptPrivacy e inicia sesión', async () => {
    vi.mocked(api.registrarCuenta).mockResolvedValue({ registrado: true })
    const iniciarSesion = vi.fn().mockResolvedValue(undefined)
    conSesion(<PaginaRegistro />, null, { iniciarSesion })
    await llenarRegistro()
    await userEvent.click(screen.getByLabelText(/Acepto el tratamiento/))
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await waitFor(() =>
      expect(api.registrarCuenta).toHaveBeenCalledWith({
        fullName: 'Carmen Pérez',
        email: 'carmen@example.org',
        password: 'una-clave-larga-1',
        acceptPrivacy: true,
      }),
    )
    await waitFor(() =>
      expect(iniciarSesion).toHaveBeenCalledWith('carmen@example.org', 'una-clave-larga-1'),
    )
  })

  it('si el ingreso automático falla, lleva a ingresar sin revelar nada', async () => {
    vi.mocked(api.registrarCuenta).mockResolvedValue({ registrado: true })
    const iniciarSesion = vi.fn().mockRejectedValue(new Error('x'))
    conSesion(<PaginaRegistro />, null, { iniciarSesion })
    await llenarRegistro()
    await userEvent.click(screen.getByLabelText(/Acepto el tratamiento/))
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('link', { name: 'Ir a ingresar' })).toBeTruthy()
  })

  it('muestra el error de la API', async () => {
    vi.mocked(api.registrarCuenta).mockRejectedValue(
      new ApiError('La contraseña no es válida: debe tener al menos 12 caracteres', 400, '/auth/register'),
    )
    conSesion(<PaginaRegistro />, null)
    await llenarRegistro()
    await userEvent.click(screen.getByLabelText(/Acepto el tratamiento/))
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/12 caracteres/)
  })
})

describe('PaginaMiCuenta (HU-16 y HU-17)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(api.obtenerMiCuenta).mockResolvedValue({
      nombre: 'Carmen Pérez',
      correo: 'carmen@example.org',
      consentimientoEn: '2026-11-27T10:00:00.000Z',
      versionAviso: '2026-11-25',
    })
  })

  it('muestra nombre, correo y fecha de aceptación', async () => {
    conSesion(<PaginaMiCuenta />, lector)
    expect(await screen.findByText('carmen@example.org')).toBeTruthy()
    expect(screen.getByText('Carmen Pérez')).toBeTruthy()
    expect(screen.getByText(/versión 2026-11-25/)).toBeTruthy()
  })

  it('elimina la cuenta con la contraseña y cierra la sesión', async () => {
    vi.mocked(api.eliminarMiCuenta).mockResolvedValue(undefined)
    const cerrarSesion = vi.fn().mockResolvedValue(undefined)
    conSesion(<PaginaMiCuenta />, lector, { cerrarSesion })
    await screen.findByText('carmen@example.org')
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }))
    await userEvent.type(screen.getByLabelText(/Escriba su contraseña/), 'una-clave-larga-1')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))
    await waitFor(() =>
      expect(api.eliminarMiCuenta).toHaveBeenCalledWith('una-clave-larga-1', 'tok'),
    )
    await waitFor(() => expect(cerrarSesion).toHaveBeenCalled())
  })

  it('con préstamo activo muestra el 409 y no cierra la sesión', async () => {
    vi.mocked(api.eliminarMiCuenta).mockRejectedValue(
      new ApiError('Devuelva el libro primero: tiene un préstamo activo', 409, '/auth/me/delete'),
    )
    const cerrarSesion = vi.fn()
    conSesion(<PaginaMiCuenta />, lector, { cerrarSesion })
    await screen.findByText('carmen@example.org')
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }))
    await userEvent.type(screen.getByLabelText(/Escriba su contraseña/), 'una-clave-larga-1')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar eliminación' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/Devuelva el libro/)
    expect(cerrarSesion).not.toHaveBeenCalled()
  })
})
