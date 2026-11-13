/**
 * Cliente único de la API (T-03). Todas las pantallas lo usan, para no repetir
 * el manejo de errores ni la lectura de la URL base.
 *
 * El backend responde los errores con un formato uniforme
 * (`AllExceptionsFilter`): { statusCode, error, message, path, timestamp }.
 */

const URL_POR_DEFECTO = 'http://localhost:3000/api/v1'

/** URL base tomada de VITE_API_URL (ver .env.example). */
export const apiUrl = import.meta.env.VITE_API_URL ?? URL_POR_DEFECTO

/** Respuesta paginada del backend: ?page=1&pageSize=10. */
export interface Paginado<T> {
  data: T[]
  meta: { page: number; pageSize: number; total: number }
}

interface CuerpoDeError {
  statusCode?: number
  error?: string
  message?: string | string[]
  path?: string
}

/** Error de la API con el código HTTP, para que la pantalla decida qué mostrar. */
export class ApiError extends Error {
  readonly statusCode: number
  readonly ruta: string
  /** Segundos que indica el backend con `Retry-After` (429); null si no vino. */
  readonly retryAfterSeconds: number | null

  constructor(
    mensaje: string,
    statusCode: number,
    ruta: string,
    retryAfterSeconds: number | null = null,
  ) {
    super(mensaje)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.ruta = ruta
    this.retryAfterSeconds = retryAfterSeconds
  }

  /** true si la causa fue la red o el servidor caído, no una respuesta HTTP. */
  get esFalloDeRed(): boolean {
    return this.statusCode === 0
  }
}

export interface OpcionesDePeticion {
  metodo?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  cuerpo?: unknown
  /** Access token JWT; lo inyecta `useSesion` cuando la ruta lo exige. */
  token?: string
  signal?: AbortSignal
}

function mensajeDeError(cuerpo: CuerpoDeError, estado: number): string {
  const { message } = cuerpo
  if (Array.isArray(message) && message.length > 0) return message.join('. ')
  if (typeof message === 'string' && message.length > 0) return message
  return `La API respondió ${estado}`
}

/**
 * Hace una petición a la API y devuelve el cuerpo ya convertido.
 * Lanza `ApiError` si la respuesta no es 2xx o si la red falla.
 */
export async function peticion<T>(
  ruta: string,
  opciones: OpcionesDePeticion = {},
): Promise<T> {
  const { metodo = 'GET', cuerpo, token, signal } = opciones
  const cabeceras = new Headers({ Accept: 'application/json' })
  if (cuerpo !== undefined) cabeceras.set('Content-Type', 'application/json')
  if (token) cabeceras.set('Authorization', `Bearer ${token}`)

  let respuesta: Response
  try {
    respuesta = await fetch(`${apiUrl}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      // Necesario para que viaje la cookie `httpOnly` del refresh token
      // (ADR-03). El backend responde con `credentials: true` en CORS.
      credentials: 'include',
      signal,
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0, ruta)
  }

  if (respuesta.status === 204) return undefined as T

  const texto = await respuesta.text()

  let datos: unknown
  try {
    datos = texto.length > 0 ? JSON.parse(texto) : undefined
  } catch {
    // Un proxy caído o un error de infraestructura puede responder HTML. Sin
    // este `catch` saldría un `SyntaxError` crudo, que las pantallas no
    // reconocen como `ApiError` y por tanto no saben explicar.
    throw new ApiError(
      `La API respondió ${respuesta.status} con un cuerpo que no es JSON`,
      respuesta.status,
      ruta,
    )
  }

  if (!respuesta.ok) {
    const cuerpoDeError = (datos ?? {}) as CuerpoDeError
    const espera = respuesta.headers.get('Retry-After')
    throw new ApiError(
      mensajeDeError(cuerpoDeError, respuesta.status),
      cuerpoDeError.statusCode ?? respuesta.status,
      cuerpoDeError.path ?? ruta,
      espera !== null && /^\d+$/.test(espera) ? Number(espera) : null,
    )
  }

  return datos as T
}

/** Arma una ruta con parámetros, omitiendo los vacíos. */
export function conParametros(
  ruta: string,
  parametros: Record<string, string | number | undefined>,
): string {
  const busqueda = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor === undefined || valor === '') continue
    busqueda.set(clave, String(valor))
  }
  const cadena = busqueda.toString()
  return cadena.length > 0 ? `${ruta}?${cadena}` : ruta
}

/** URL absoluta de un recurso de la API (p. ej. una imagen descargable). */
export function urlAbsoluta(ruta: string): string {
  return `${apiUrl}${ruta}`
}
