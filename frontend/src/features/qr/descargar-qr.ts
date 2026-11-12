import { ApiError, urlAbsoluta } from '../../shared/api/client'

/**
 * Pide el QR de una sala con el token de la sesión. La ruta exige rol STAFF o
 * ADMIN, y un enlace simple no puede enviar la cabecera `Authorization`.
 */
export async function obtenerQrDeSala(
  salaId: string,
  token: string,
): Promise<Blob> {
  const ruta = `/rooms/${salaId}/qr`
  let respuesta: Response
  try {
    respuesta = await fetch(urlAbsoluta(ruta), {
      headers: { Accept: 'image/png', Authorization: `Bearer ${token}` },
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0, ruta)
  }
  if (!respuesta.ok) {
    throw new ApiError(
      `La API respondió ${respuesta.status}`,
      respuesta.status,
      ruta,
    )
  }
  return respuesta.blob()
}

/** Nombre de archivo sin tildes ni espacios: «Sala Caribe» → `qr-sala-caribe.png`. */
export function nombreDeArchivoQr(nombreDeSala: string): string {
  const limpio = nombreDeSala
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `qr-${limpio || 'sala'}.png`
}

/** Entrega al navegador una imagen ya descargada para que la guarde como archivo. */
export function guardarArchivo(contenido: Blob, nombre: string): void {
  const url = URL.createObjectURL(contenido)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

/** Mensaje para la persona según la causa del fallo. */
export function mensajeDeFalloQr(causa: unknown): string {
  if (causa instanceof ApiError) {
    if (causa.esFalloDeRed) {
      return 'No pudimos conectarnos con el servidor. Revise su conexión e intente de nuevo.'
    }
    if (causa.statusCode === 401) {
      return 'Su sesión venció. Ingrese de nuevo para descargar el código.'
    }
    if (causa.statusCode === 403) {
      return 'Su cuenta no tiene permiso para descargar este código.'
    }
    if (causa.statusCode === 404) {
      return 'La sala ya no existe. Actualice la página.'
    }
  }
  return 'No se pudo descargar el código. Intente de nuevo.'
}
