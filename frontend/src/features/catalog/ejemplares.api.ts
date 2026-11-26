import { peticion } from '../../shared/api/client'

export type EstadoEjemplar = 'DISPONIBLE' | 'PRESTADO' | 'MANTENIMIENTO' | 'BAJA'

/** Estados que el personal pone a mano (PRESTADO lo maneja Préstamos). */
export type EstadoEditable = Exclude<EstadoEjemplar, 'PRESTADO'>

/** `GET /catalog/shelves` (HU-11). */
export interface Estante {
  id: string
  code: string
  section: string
  room: string
}

/** Respuesta de `PATCH /catalog/copies/:id`. */
export interface EjemplarActualizado {
  id: string
  inventoryCode: string
  status: EstadoEjemplar
  shelfId: string
  shelf: string
  section: string
  room: string
}

export interface CambiosEjemplar {
  shelfId?: string
  status?: EstadoEditable
}

export async function listarEstantes(
  token: string,
  signal?: AbortSignal,
): Promise<Estante[]> {
  const respuesta = await peticion<{ data: Estante[] }>('/catalog/shelves', {
    token,
    signal,
  })
  return respuesta.data
}

export function actualizarEjemplar(
  id: string,
  cambios: CambiosEjemplar,
  token: string,
): Promise<EjemplarActualizado> {
  return peticion<EjemplarActualizado>(
    `/catalog/copies/${encodeURIComponent(id)}`,
    { metodo: 'PATCH', cuerpo: cambios, token },
  )
}

/** «Sala General › Narrativa › A-01». */
export function rotuloEstante(e: {
  room: string
  section: string
  shelf?: string
  code?: string
}): string {
  return `${e.room} › ${e.section} › ${e.shelf ?? e.code ?? ''}`
}
