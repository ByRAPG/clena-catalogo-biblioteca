/**
 * Cuándo conviene renovar el access token.
 *
 * El token vive solo en memoria (ADR-03) y dura poco (15 minutos por defecto
 * en el backend). Si nadie lo renueva, a los 15 minutos todas las pantallas del
 * personal empiezan a recibir 401. Por eso el proveedor de sesión lo renueva un
 * minuto antes de que venza, leyendo `exp` del propio JWT: así no depende de
 * que el backend y el frontend tengan configurada la misma duración.
 *
 * Solo se lee el campo `exp` para programar la renovación; el token no se
 * valida aquí (eso lo hace siempre el backend).
 */

/** Margen antes del vencimiento en el que se renueva. */
export const MARGEN_MS = 60_000
/** Si el token no trae `exp` legible, se renueva a los 10 minutos. */
export const ESPERA_POR_DEFECTO_MS = 10 * 60_000
/** Nunca se reintenta antes de esto, aunque el token ya esté por vencer. */
const ESPERA_MINIMA_MS = 5_000

/** Momento (ms desde 1970) en que vence el JWT, o `null` si no se puede leer. */
export function venceEn(token: string): number | null {
  const partes = token.split('.')
  if (partes.length !== 3) return null
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const carga: unknown = JSON.parse(atob(base64))
    if (
      typeof carga === 'object' &&
      carga !== null &&
      'exp' in carga &&
      typeof carga.exp === 'number'
    ) {
      return carga.exp * 1000
    }
    return null
  } catch {
    return null
  }
}

/** Milisegundos que hay que esperar, desde `ahora`, para renovar el token. */
export function esperaHastaRenovar(token: string, ahora: number): number {
  const vence = venceEn(token)
  if (vence === null) return ESPERA_POR_DEFECTO_MS
  return Math.max(vence - MARGEN_MS - ahora, ESPERA_MINIMA_MS)
}
