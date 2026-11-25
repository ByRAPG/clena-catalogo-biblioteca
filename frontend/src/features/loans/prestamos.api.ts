import { conParametros, peticion } from '../../shared/api/client'

export type EstadoFiltroPrestamo = 'active' | 'returned' | 'all'

export interface PrestamoEjemplar {
  id: string
  inventoryCode: string
  status: 'DISPONIBLE' | 'PRESTADO' | 'MANTENIMIENTO' | 'BAJA'
  workId: string
  workTitle: string
  room: string
  section: string
  shelf: string
}

export interface EjemplarParaPrestamo extends PrestamoEjemplar {
  hasActiveReservation: boolean
}

export interface PrestamoLector {
  id: string
  fullName: string
  documentId: string | null
  email: string | null
}

export interface LectorMostrador extends PrestamoLector {
  phone: string | null
}

export interface Prestamo {
  id: string
  loanedAt: string
  dueAt: string
  returnedAt: string | null
  active: boolean
  overdue: boolean
  copy: PrestamoEjemplar
  reader: PrestamoLector
  staff: { id: string; fullName: string } | null
}

export interface ListaPrestamos {
  data: Prestamo[]
  total: number
  page: number
  pageSize: number
}

export interface DatosPrestamoNuevo {
  copyId?: string
  inventoryCode?: string
  readerId: string
  loanDays?: number
}

export interface DatosLectorNuevo {
  fullName: string
  documentId?: string
  email?: string
  phone?: string
}

export function listarPrestamos(
  params: {
    status?: EstadoFiltroPrestamo
    q?: string
    page?: number
    pageSize?: number
  },
  token: string,
  signal?: AbortSignal,
): Promise<ListaPrestamos> {
  return peticion<ListaPrestamos>(conParametros('/loans', params), {
    token,
    signal,
  })
}

export function registrarPrestamo(
  datos: DatosPrestamoNuevo,
  token: string,
): Promise<Prestamo> {
  return peticion<Prestamo>('/loans', {
    metodo: 'POST',
    cuerpo: datos,
    token,
  })
}

export function devolverPrestamo(
  loanId: string,
  token: string,
): Promise<Prestamo> {
  return peticion<Prestamo>(`/loans/${encodeURIComponent(loanId)}/return`, {
    metodo: 'POST',
    token,
  })
}

export async function buscarLectores(
  q: string,
  token: string,
  signal?: AbortSignal,
): Promise<LectorMostrador[]> {
  const respuesta = await peticion<{ data: LectorMostrador[] }>(
    conParametros('/loans/readers', { q, limit: 30 }),
    { token, signal },
  )
  return respuesta.data
}

export function registrarLector(
  datos: DatosLectorNuevo,
  token: string,
): Promise<LectorMostrador> {
  return peticion<LectorMostrador>('/loans/readers', {
    metodo: 'POST',
    cuerpo: datos,
    token,
  })
}

export async function buscarEjemplares(
  q: string,
  token: string,
  signal?: AbortSignal,
): Promise<EjemplarParaPrestamo[]> {
  const respuesta = await peticion<{ data: EjemplarParaPrestamo[] }>(
    conParametros('/loans/copies', { q, limit: 30 }),
    { token, signal },
  )
  return respuesta.data
}
