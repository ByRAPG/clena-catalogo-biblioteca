/** true solo si `valor` es una URL válida con protocolo http o https. */
export function esUrlWeb(valor: string | null | undefined): valor is string {
  if (!valor) return false
  try {
    const { protocol } = new URL(valor)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}
