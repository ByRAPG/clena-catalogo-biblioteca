import { peticion } from '../../shared/api/client'

export type ResultadoFila =
  | { row: number; status: 'created' | 'updated' }
  | { row: number; status: 'failed'; field?: string; error: string }

export interface ResumenImportacion {
  created: number
  updated: number
}

export interface ReporteImportacion {
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
