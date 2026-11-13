import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  apiUrl,
  conParametros,
  peticion,
  urlAbsoluta,
  type Paginado,
} from './client'

interface Obra {
  id: string
  titulo: string
}

function respuesta(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('peticion', () => {
  it('devuelve el cuerpo convertido cuando la API responde 200', async () => {
    const pagina: Paginado<Obra> = {
      data: [{ id: '1', titulo: 'Cien años de soledad' }],
      meta: { page: 1, pageSize: 10, total: 1 },
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(pagina)))

    const recibido = await peticion<Paginado<Obra>>('/obras')

    expect(recibido.data[0].titulo).toBe('Cien años de soledad')
    expect(recibido.meta.total).toBe(1)
  })

  it('envía el token cuando se le pasa', async () => {
    const simulada = vi.fn().mockResolvedValue(respuesta({ ok: true }))
    vi.stubGlobal('fetch', simulada)

    await peticion('/obras', { metodo: 'POST', cuerpo: { titulo: 'x' }, token: 'abc' })

    const [, opciones] = simulada.mock.calls[0] as [string, RequestInit]
    const cabeceras = new Headers(opciones.headers)
    expect(cabeceras.get('Authorization')).toBe('Bearer abc')
    expect(opciones.method).toBe('POST')
  })

  it('lanza ApiError con el mensaje del formato uniforme del backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        respuesta(
          {
            statusCode: 409,
            error: 'Conflict',
            message: 'El ejemplar ya está prestado',
            path: '/api/v1/loans',
          },
          409,
        ),
      ),
    )

    await expect(peticion('/loans', { metodo: 'POST' })).rejects.toMatchObject({
      statusCode: 409,
      message: 'El ejemplar ya está prestado',
    })
  })

  it('une los mensajes cuando la validación devuelve una lista', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          respuesta({ statusCode: 400, message: ['falta el título', 'falta el autor'] }, 400),
        ),
    )

    await expect(peticion('/obras')).rejects.toThrow('falta el título. falta el autor')
  })

  it('marca el fallo de red para distinguirlo de un error del servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))

    const error = await peticion('/obras').catch((causa: unknown) => causa)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).esFalloDeRed).toBe(true)
  })

  it('traduce a ApiError un cuerpo que no es JSON', async () => {
    // Un proxy caído responde HTML con un 502; antes salía un SyntaxError que
    // las pantallas no reconocían.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html><body>502 Bad Gateway</body></html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    )

    const error = await peticion('/obras').catch((causa: unknown) => causa)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).statusCode).toBe(502)
    expect((error as ApiError).esFalloDeRed).toBe(false)
  })

  it('envía las credenciales para que viaje la cookie de renovación', async () => {
    const simulada = vi.fn().mockResolvedValue(respuesta({ ok: true }))
    vi.stubGlobal('fetch', simulada)

    await peticion('/auth/refresh', { metodo: 'POST' })

    const [, opciones] = simulada.mock.calls[0] as [string, RequestInit]
    expect(opciones.credentials).toBe('include')
  })

  it('no intenta convertir el cuerpo de un 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    await expect(peticion('/obras/1')).resolves.toBeUndefined()
  })
})

describe('conParametros', () => {
  it('arma la consulta y omite los valores vacíos', () => {
    expect(conParametros('/obras', { q: 'cien', sala: '', page: 2 })).toBe(
      '/obras?q=cien&page=2',
    )
  })

  it('deja la ruta igual si no hay parámetros útiles', () => {
    expect(conParametros('/obras', { q: undefined })).toBe('/obras')
  })
})

describe('urlAbsoluta', () => {
  it('antepone la URL base de la API a la ruta', () => {
    expect(urlAbsoluta('/rooms/qr')).toBe(`${apiUrl}/rooms/qr`)
  })
})
