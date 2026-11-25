const UTF8_BOM = [0xef, 0xbb, 0xbf] as const

/**
 * Decodifica un CSV en bytes aceptando UTF-8 (con o sin BOM) y Windows-1252
 * (codificación habitual de Excel en español).
 */
export function decodificarBytesCsv(bytes: Uint8Array): string {
  const tieneBom =
    bytes.byteLength >= 3 &&
    bytes[0] === UTF8_BOM[0] &&
    bytes[1] === UTF8_BOM[1] &&
    bytes[2] === UTF8_BOM[2]

  const datos = tieneBom ? bytes.subarray(3) : bytes

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(datos)
  } catch {
    return new TextDecoder('windows-1252').decode(datos)
  }
}

export async function leerArchivoCsv(archivo: File): Promise<string> {
  if (typeof archivo.arrayBuffer === 'function') {
    const buffer = await archivo.arrayBuffer()
    return decodificarBytesCsv(new Uint8Array(buffer))
  }
  return archivo.text()
}
