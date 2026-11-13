import { StrictMode, useEffect } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { olvidarRenovacionCompartida } from './renovacion-compartida'
import { useSesion } from './sesion-context'
import { SesionProvider } from './sesion-provider'

/** Muestra el estado de la sesión en texto, para poder afirmarlo. */
function Testigo() {
  const { sesion, recuperando } = useSesion()
  if (recuperando) return <p>recuperando</p>
  return <p>{sesion === null ? 'sin sesión' : `${sesion.nombre} · ${sesion.rol}`}</p>
}

function pintar() {
  return render(
    <SesionProvider>
      <Testigo />
    </SesionProvider>,
  )
}

function respuestaDeSesion() {
  return Response.json({
    accessToken: 'jwt-de-prueba',
    usuario: { nombre: 'Marta Bibliotecaria', rol: 'STAFF' },
  })
}

function sinSesion() {
  return new Response(JSON.stringify({ statusCode: 401 }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  // La renovación en curso vive en el módulo, así que una prueba que deja la
  // petición sin responder se la heredaría a la siguiente.
  olvidarRenovacionCompartida()
  sessionStorage.clear()
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('SesionProvider', () => {
  it('recupera la sesión con la cookie al cargar la página', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuestaDeSesion()))
    pintar()

    expect(await screen.findByText('Marta Bibliotecaria · STAFF')).toBeDefined()
  })

  it('pide la renovación a /auth/refresh con POST y credenciales', async () => {
    const simulada = vi.fn().mockResolvedValue(respuestaDeSesion())
    vi.stubGlobal('fetch', simulada)
    pintar()

    await screen.findByText('Marta Bibliotecaria · STAFF')

    const [url, opciones] = simulada.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/auth/refresh')
    expect(opciones.method).toBe('POST')
    expect(opciones.credentials).toBe('include')
  })

  it('no guarda el token en sessionStorage ni en localStorage (ADR-03)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuestaDeSesion()))
    pintar()

    await screen.findByText('Marta Bibliotecaria · STAFF')

    // El token solo vive en memoria: si apareciera en un storage, cualquier
    // script de la página podría leerlo.
    expect(sessionStorage.length).toBe(0)
    expect(localStorage.length).toBe(0)
    expect(JSON.stringify(sessionStorage)).not.toContain('jwt-de-prueba')
    expect(JSON.stringify(localStorage)).not.toContain('jwt-de-prueba')
  })

  it('se queda sin sesión cuando no hay cookie que renovar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sinSesion()))
    pintar()

    expect(await screen.findByText('sin sesión')).toBeDefined()
  })

  it('se queda sin sesión, y no colgado, si la renovación falla por red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    pintar()

    expect(await screen.findByText('sin sesión')).toBeDefined()
  })

  it('anuncia que está recuperando mientras la renovación está en vuelo', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})))
    pintar()

    expect(screen.getByText('recuperando')).toBeDefined()
  })

  it('con StrictMode renueva una sola vez, aunque el efecto corra dos', async () => {
    // El refresh token es de un solo uso: dos peticiones con la misma cookie
    // hacen que el backend tome la segunda por reuso y revoque la familia.
    const simulada = vi.fn().mockResolvedValue(respuestaDeSesion())
    vi.stubGlobal('fetch', simulada)

    let montajes = 0
    function Sonda() {
      useEffect(() => {
        montajes += 1
      }, [])
      return null
    }

    render(
      <StrictMode>
        <SesionProvider>
          <Sonda />
          <Testigo />
        </SesionProvider>
      </StrictMode>,
    )

    await screen.findByText('Marta Bibliotecaria · STAFF')

    // Si `montajes` fuera 1, StrictMode no estaría duplicando el efecto y la
    // prueba pasaría sin comprobar nada.
    expect(montajes).toBeGreaterThan(1)
    expect(simulada).toHaveBeenCalledTimes(1)
  })

  it('deja la sesión abierta tras iniciar sesión con correo y contraseña', async () => {
    const simulada = vi
      .fn()
      .mockResolvedValueOnce(sinSesion())
      .mockResolvedValueOnce(respuestaDeSesion())
    vi.stubGlobal('fetch', simulada)

    function Formulario() {
      const { sesion, iniciarSesion } = useSesion()
      return (
        <>
          <button
            type="button"
            onClick={() => void iniciarSesion('personal@example.org', 'secreta')}
          >
            entrar
          </button>
          <p>{sesion === null ? 'sin sesión' : sesion.nombre}</p>
        </>
      )
    }

    render(
      <SesionProvider>
        <Formulario />
      </SesionProvider>,
    )

    await screen.findByText('sin sesión')
    screen.getByRole('button', { name: 'entrar' }).click()

    await waitFor(() =>
      expect(screen.getByText('Marta Bibliotecaria')).toBeDefined(),
    )

    const [url, opciones] = simulada.mock.calls[1] as [string, RequestInit]
    expect(url).toContain('/auth/login')
    expect(JSON.parse(String(opciones.body))).toEqual({
      email: 'personal@example.org',
      password: 'secreta',
    })
    expect(sessionStorage.length).toBe(0)
  })
})
