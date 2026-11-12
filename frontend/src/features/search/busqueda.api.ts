/**
 * Contrato de la API de búsqueda (Issue #28, módulo `search` del backend).
 * Los nombres de los campos son los del backend a propósito: así se ve de
 * una vez si la respuesta cambió y no hay que adivinar la correspondencia.
 */
import { conParametros, peticion, type Paginado } from '../../shared/api/client'

export type EstadoDisponibilidad = 'DISPONIBLE' | 'NO_DISPONIBLE'
export type MotivoNoDisponible = 'PRESTADO' | 'MANTENIMIENTO' | 'SIN_EJEMPLARES'
export type DondeCoincidio = 'title' | 'author' | 'subject'
export type EstadoEjemplar = 'DISPONIBLE' | 'PRESTADO' | 'MANTENIMIENTO'

/** Categoría o sala del filtro: `GET /search/categories` y `/search/rooms`. */
export interface OpcionDeFiltro {
  id: string
  name: string
}

export interface Ubicacion {
  room: string
  section: string
  shelf: string
}

export interface Disponibilidad {
  status: EstadoDisponibilidad
  reason: MotivoNoDisponible | null
  availableCopies: number
  totalCopies: number
  hasDigital: boolean
}

export interface ObraResumen {
  id: string
  title: string
  authors: string[]
  subjects: string[]
  category: OpcionDeFiltro | null
  year: number | null
  /** Dónde coincidió el término buscado; `null` si la búsqueda no llevó `q`. */
  matchedOn: DondeCoincidio | null
  availability: Disponibilidad
  /** Ubicación del primer ejemplar disponible; `null` si la obra no tiene. */
  location: Ubicacion | null
}

export interface Ejemplar {
  inventoryCode: string
  status: EstadoEjemplar
  room: string
  section: string
  shelf: string
}

export interface ObraDetalle extends ObraResumen {
  subtitle: string | null
  publisher: string | null
  isbn: string | null
  classification: string | null
  digitalUrl: string | null
  copies: Ejemplar[]
}

/** HU-01 pide los resultados «de 10 en 10»; el backend acepta hasta 50. */
export const TAMANO_DE_PAGINA = 10

export interface CriteriosDeBusqueda {
  q?: string
  categoryId?: string
  roomId?: string
  /** Solo obras con algún ejemplar disponible. */
  soloDisponibles?: boolean
  page?: number
}

export function buscarObras(
  criterios: CriteriosDeBusqueda,
  signal?: AbortSignal,
): Promise<Paginado<ObraResumen>> {
  const ruta = conParametros('/search/works', {
    q: criterios.q,
    categoryId: criterios.categoryId,
    roomId: criterios.roomId,
    // El backend solo admite la cadena 'true'; cualquier otro valor da 400.
    available: criterios.soloDisponibles ? 'true' : undefined,
    page: criterios.page,
    pageSize: TAMANO_DE_PAGINA,
  })
  return peticion<Paginado<ObraResumen>>(ruta, { signal })
}

export function obtenerObra(
  id: string,
  signal?: AbortSignal,
): Promise<ObraDetalle> {
  return peticion<ObraDetalle>(`/search/works/${id}`, { signal })
}

export function listarCategorias(
  signal?: AbortSignal,
): Promise<{ data: OpcionDeFiltro[] }> {
  return peticion<{ data: OpcionDeFiltro[] }>('/search/categories', { signal })
}

export function listarSalas(
  signal?: AbortSignal,
): Promise<{ data: OpcionDeFiltro[] }> {
  return peticion<{ data: OpcionDeFiltro[] }>('/search/rooms', { signal })
}
