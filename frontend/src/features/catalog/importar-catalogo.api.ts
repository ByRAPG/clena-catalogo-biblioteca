import { ApiError, apiUrl, peticion } from '../../shared/api/client'

export type ResultadoFila =
  | { row: number; status: 'created' | 'updated' }
  | { row: number; status: 'failed'; field?: string; error: string }

export interface ResumenImportacion {
  created: number
  updated: number
}

export interface ReporteImportacion {
  /** Id del registro de importación (solo en la importación real). */
  importId?: string
  dryRun?: boolean
  /** Filas creadas del archivo (cada fila puede crear un libro y un ejemplar). */
  created: number
  updated: number
  failed: number
  works?: ResumenImportacion
  copies?: ResumenImportacion
  rows: ResultadoFila[]
}

export function importarCatalogo(
  content: string,
  fileName: string,
  token: string,
) {
  return peticion<ReporteImportacion>('/catalog/imports', {
    metodo: 'POST',
    cuerpo: { content, fileName },
    token,
  })
}

export function simularImportacion(
  content: string,
  fileName: string,
  token: string,
) {
  return peticion<ReporteImportacion>('/catalog/imports/preview', {
    metodo: 'POST',
    cuerpo: { content, fileName },
    token,
  })
}

/**
 * Descarga el CSV de errores: de la importación ejecutada si hay `importId`;
 * si no, de la simulación del mismo contenido.
 */
export async function descargarErroresCsv(
  token: string,
  origen: { importId?: string; content: string; fileName: string },
): Promise<Blob> {
  const ruta = origen.importId
    ? `/catalog/imports/${origen.importId}/errors`
    : '/catalog/imports/preview/errors'
  const cabeceras = new Headers({ Authorization: `Bearer ${token}` })
  let cuerpo: string | undefined
  if (!origen.importId) {
    cabeceras.set('Content-Type', 'application/json')
    cuerpo = JSON.stringify({
      content: origen.content,
      fileName: origen.fileName,
    })
  }
  let respuesta: Response
  try {
    respuesta = await fetch(`${apiUrl}${ruta}`, {
      method: origen.importId ? 'GET' : 'POST',
      headers: cabeceras,
      body: cuerpo,
      credentials: 'include',
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0, ruta)
  }
  if (!respuesta.ok) {
    throw new ApiError(
      'No se pudo descargar el informe de errores',
      respuesta.status,
      ruta,
    )
  }
  return respuesta.blob()
}
