import { peticion } from '../../shared/api/client'

export type ResultadoFila =
  | { row: number; status: 'created' | 'updated' }
  | { row: number; status: 'failed'; field?: string; error: string }

export interface ReporteImportacion {
  created: number
  updated: number
  failed: number
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
