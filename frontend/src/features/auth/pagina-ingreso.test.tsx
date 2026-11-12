import { MantineProvider, Text } from '@mantine/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Layout } from '../../app/layout'
import { SesionProvider } from './sesion-provider'
import { PaginaIngreso } from './pagina-ingreso'
import { theme } from '../../shared/theme/theme'

function respuesta(cuerpo: unknown, estado = 200, headers?: HeadersInit) {
  const cabeceras = new Headers(headers)
  cabeceras.set('Content-Type', 'application/json')
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: cabeceras,
  })
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

function enviarFormulario() {
  const formulario = screen
    .getByRole('button', { name: 'Iniciar sesión' })
    .closest('form')
  if (!formulario) throw new Error('No se encontró el formulario de ingreso')
  fireEvent.submit(formulario)
}

afterEach(() => {
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

describe('inicio de sesión', () => {
  it('inicia sesión y vuelve a la ruta desde la que se pidió ingresar', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respuesta({
        accessToken: 'token-prueba',
        usuario: { nombre: 'Personal de prueba', rol: 'STAFF' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    pintarIngreso('/destino')

    fireEvent.change(screen.getByLabelText(/Correo institucional/), {
      target: { value: 'personal@example.org' },
    })
    fireEvent.change(screen.getByLabelText(/^Contraseña/), {
      target: { value: 'clave-de-prueba' },
    })
    enviarFormulario()

    expect(
      await screen.findByRole('heading', { name: 'Destino recordado' }),
    ).toBeDefined()
    expect(JSON.parse(sessionStorage.getItem('clena.sesion') ?? '{}')).toEqual({
      token: 'token-prueba',
      nombre: 'Personal de prueba',
      rol: 'STAFF',
    })
    const [, opciones] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(opciones.method).toBe('POST')
    expect(JSON.parse(String(opciones.body))).toEqual({
      email: 'personal@example.org',
      password: 'clave-de-prueba',
    })
  })

  it('envía al catálogo público por defecto a un lector', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        respuesta({
          accessToken: 'token-lector',
          usuario: { nombre: 'Lector de prueba', rol: 'READER' },
        }),
      ),
    )
    pintarIngreso()
    fireEvent.change(screen.getByLabelText(/Correo institucional/), {
      target: { value: 'lector@example.org' },
    })
    fireEvent.change(screen.getByLabelText(/^Contraseña/), {
      target: { value: 'clave-de-prueba' },
    })
    enviarFormulario()

    expect(
      await screen.findByRole('heading', { name: 'Catálogo público' }),
    ).toBeDefined()
  })

  it('muestra el mensaje de credenciales incorrectas al recibir 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        respuesta({ statusCode: 401, message: 'Credenciales inválidas' }, 401),
      ),
    )
    pintarIngreso()
    fireEvent.change(screen.getByLabelText(/Correo institucional/), {
      target: { value: 'personal@example.org' },
    })
    fireEvent.change(screen.getByLabelText(/^Contraseña/), {
      target: { value: 'incorrecta' },
    })
    enviarFormulario()

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Correo o contraseña incorrectos. Revisa tus datos y vuelve a intentarlo.',
      ),
    )
  })

  it('bloquea el formulario y muestra la espera enviada con 429', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        respuesta(
          { statusCode: 429, message: 'Cuenta bloqueada' },
          429,
          { 'Retry-After': '90' },
        ),
      ),
    )
    pintarIngreso()
    fireEvent.change(screen.getByLabelText(/Correo institucional/), {
      target: { value: 'personal@example.org' },
    })
    fireEvent.change(screen.getByLabelText(/^Contraseña/), {
      target: { value: 'incorrecta' },
    })
    enviarFormulario()

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Acceso bloqueado tras 5 intentos',
      ),
    )
    expect(screen.getByRole('alert').textContent).toContain('1 minuto y 30 segundos')
    expect(
      screen
        .getByRole('button', { name: 'Acceso bloqueado' })
        .hasAttribute('disabled'),
    ).toBe(true)
  })
})

describe('cierre de sesión', () => {
  it('envía logout y limpia la sesión después de recibir respuesta', async () => {
    sessionStorage.setItem(
      'clena.sesion',
      JSON.stringify({
        token: 'token-prueba',
        nombre: 'Personal de prueba',
        rol: 'STAFF',
      }),
    )
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    render(
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

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull(),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/logout$/),
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    )
    expect(sessionStorage.getItem('clena.sesion')).toBeNull()
  })
})
