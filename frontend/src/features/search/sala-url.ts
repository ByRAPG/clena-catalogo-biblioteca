/** Formato UUID (cualquier versión) que usa el backend para los ids de sala. */
const FORMATO_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Lee el parámetro `sala` de la URL (el que lleva el QR de cada sala, HU-05).
 * Devuelve el id o `null` si falta o no tiene formato UUID.
 * Uso: `leerSalaDeLaUrl(useSearchParams()[0])` o `leerSalaDeLaUrl(location.search)`.
 */
export function leerSalaDeLaUrl(
  busqueda: string | URLSearchParams,
): string | null {
  const parametros =
    typeof busqueda === 'string' ? new URLSearchParams(busqueda) : busqueda
  const valor = parametros.get('sala')?.trim() ?? ''
  return FORMATO_UUID.test(valor) ? valor : null
}
