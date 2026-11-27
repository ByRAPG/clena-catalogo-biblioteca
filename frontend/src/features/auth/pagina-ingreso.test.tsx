import { MantineProvider, Text } from '@mantine/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Layout } from '../../app/layout'
import { theme } from '../../shared/theme/theme'
import { PaginaIngreso } from './pagina-ingreso'
import { olvidarRenovacionCompartida } from './renovacion-compartida'
import { SesionProvider } from './sesion-provider'

function respuesta(cuerpo: unknown, estado = 200, headers?: HeadersInit) {
  const cabeceras = new Headers(headers)
  cabeceras.set('Content-Type', 'application/json')
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: cabeceras,
  })
}

const sinSesion = () =>
  respuesta({ statusCode: 401, message: 'Sesión no válida' }, 401)

const sesionDePersonal = () =>
  respuesta({
    accessToken: 'token-prueba',
    usuario: { nombre: 'Personal de prueba', rol: 'STAFF' },
  })

interface Respuestas {
  refresh?: () => Response
  login?: () => Response
  logout?: () => Response
}

/**
 * Al cargar, el proveedor pide `POST /auth/refresh` para recuperar la sesión;
 * por defecto responde 401, como a quien aún no ingresó.
 */
function simularApi({ refresh = sinSesion, login, logout }: Respuestas = {}) {
  const simulada = vi.fn<typeof fetch>((entrada) => {
    const ruta = String(entrada)
    if (ruta.endsWith('/auth/refresh')) return Promise.resolve(refresh())
    if (ruta.endsWith('/auth/login') && login) return Promise.resolve(login())
    if (ruta.endsWith('/auth/logout') && logout) {
      return Promise.resolve(logout())
    }
    return Promise.reject(new Error(`Petición no simulada: ${ruta}`))
  })
  vi.stubGlobal('fetch', simulada)
  return simulada
}

function pintarIngreso(desde?: string) {
  return render(
    <MantineProvider theme={theme}>
      <SesionProvider>
        <MemoryRouter
          initialEntries={[
            { pathname: '/ingresar', state: desde ? { desde } : null },
          ]}
        >
          <Routes>
            <Route path="/ingresar" element={<PaginaIngreso />} />
            <Route path="/gestion" element={<h1>Gestión destino</h1>} />
            <Route path="/destino" element={<h1>Destino recordado</h1>} />
            <Route path="/" element={<h1>Catálogo público</h1>} />
          </Routes>
        </MemoryRouter>
      </SesionProvider>
    </MantineProvider>,
  )
}

function pintarLayout() {
  return render(
    <MantineProvider theme={theme}>
      <SesionProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Text>Catálogo</Text>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </SesionProvider>
    </MantineProvider>,
  )
}

/** El formulario aparece cuando termina la recuperación de la sesión. */
async function llenarFormulario(correo: string, contrasena: string) {
  fireEvent.change(await screen.findByLabelText(/^Correo/), {
    target: { value: correo },
  })
  fireEvent.change(screen.getByLabelText(/^Contraseña/), {
    target: { value: contrasena },
  })
}

function enviarFormulario() {
  const formulario = screen
    .getByRole('button', { name: 'Iniciar sesión' })
    .closest('form')
  if (!formulario) throw new Error('No se encontró el formulario de ingreso')
  fireEvent.submit(formulario)
}

beforeEach(() => {
  // La renovación en curso vive en el módulo: una prueba que la deja sin
  // responder se la heredaría a la siguiente.
  olvidarRenovacionCompartida()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('inicio de sesión', () => {
  it('inicia sesión y vuelve a la ruta desde la que se pidió ingresar', async () => {
    const simulada = simularApi({ login: sesionDePersonal })
    pintarIngreso('/destino')

    await llenarFormulario('personal@example.org', 'clave-de-prueba')
    enviarFormulario()

    expect(
      await screen.findByRole('heading', { name: 'Destino recordado' }, { timeout: 4000 }),
    ).toBeDefined()
    const llamada = simulada.mock.calls.find(([entrada]) =>
      String(entrada).endsWith('/auth/login'),
    )
    expect(llamada?.[1]?.method).toBe('POST')
    expect(JSON.parse(String(llamada?.[1]?.body))).toEqual({
      email: 'personal@example.org',
      password: 'clave-de-prueba',
    })
  })

  it('envía al catálogo público por defecto a un lector', async () => {
    simularApi({
      login: () =>
        respuesta({
          accessToken: 'token-lector',
          usuario: { nombre: 'Lector de prueba', rol: 'READER' },
        }),
    })
    pintarIngreso()

    await llenarFormulario('lector@example.org', 'clave-de-prueba')
    enviarFormulario()

    expect(
      await screen.findByRole('heading', { name: 'Catálogo público' }, { timeout: 4000 }),
    ).toBeDefined()
  })

  it('no muestra el formulario si la sesión ya se recuperó con la cookie', async () => {
    simularApi({ refresh: sesionDePersonal })
    pintarIngreso()

    expect(
      await screen.findByRole('heading', { name: 'Gestión destino' }),
    ).toBeDefined()
    expect(screen.queryByLabelText(/^Correo/)).toBeNull()
  })

  it('muestra el mensaje de credenciales incorrectas al recibir 401', async () => {
    simularApi({
      login: () =>
        respuesta({ statusCode: 401, message: 'Credenciales inválidas' }, 401),
    })
    pintarIngreso()

    await llenarFormulario('personal@example.org', 'incorrecta')
    enviarFormulario()

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Correo o contraseña incorrectos. Revisa tus datos y vuelve a intentarlo.',
      ),
    )
  })

  it('con 429 bloquea el formulario y muestra la espera enviada', async () => {
    simularApi({
      login: () =>
        respuesta({ statusCode: 429, message: 'Demasiadas peticiones' }, 429, {
          'Retry-After': '90',
        }),
    })
    pintarIngreso()

    await llenarFormulario('personal@example.org', 'incorrecta')
    enviarFormulario()

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Demasiados intentos desde este equipo',
      ),
    )
    // El aviso es fijo; la cuenta regresiva va aparte para el lector de pantalla.
    const aviso = screen.getByRole('alert')
    expect(aviso.textContent).toContain('Espere un momento e intente de nuevo.')
    expect(aviso.textContent).not.toContain('segundos')
    expect(
      screen.getByText(/Puede volver a intentarlo en 1 minuto y 30 segundos/),
    ).toBeDefined()
    expect(
      screen
        .getByRole('button', { name: 'Espere un momento' })
        .hasAttribute('disabled'),
    ).toBe(true)
  })

  it('con 429 sin Retry-After usa una espera de 60 segundos', async () => {
    simularApi({
      login: () =>
        respuesta({ statusCode: 429, message: 'Demasiadas peticiones' }, 429),
    })
    pintarIngreso()

    await llenarFormulario('personal@example.org', 'incorrecta')
    enviarFormulario()

    expect(
      await screen.findByText(/Puede volver a intentarlo en 1 minuto\./),
    ).toBeDefined()
  })
})

describe('cierre de sesión', () => {
  it('cierra la sesión y vuelve a ofrecer Ingresar', async () => {
    const simulada = simularApi({
      refresh: sesionDePersonal,
      logout: () => new Response(null, { status: 204 }),
    })
    pintarLayout()

    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByRole('link', { name: 'Ingresar' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull()
    expect(simulada).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/logout$/),
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    )
  })

  it('cierra la sesión en este navegador aunque falle el logout', async () => {
    simularApi({
      refresh: sesionDePersonal,
      logout: () => respuesta({ statusCode: 500, message: 'Error' }, 500),
    })
    pintarLayout()

    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByRole('link', { name: 'Ingresar' })).toBeDefined()
  })
})
