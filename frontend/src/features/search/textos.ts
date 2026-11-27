/**
 * Textos de estado en español. Separados de los componentes porque
 * `react-refresh/only-export-components` no admite exportar funciones
 * junto a un componente, y porque así hay un solo sitio donde cambiarlos.
 */
import type { EstadoEjemplar, MotivoNoDisponible } from './busqueda.api'

const MOTIVOS: Record<MotivoNoDisponible, string> = {
  PRESTADO: 'Prestado',
  MANTENIMIENTO: 'En mantenimiento',
  SIN_EJEMPLARES: 'Sin ejemplares',
}

const ESTADOS_DE_EJEMPLAR: Record<EstadoEjemplar, string> = {
  DISPONIBLE: 'Disponible',
  PRESTADO: 'Prestado',
  MANTENIMIENTO: 'En mantenimiento',
}

/** Motivo por el que la obra no está disponible, o cadena vacía si no hay. */
export function textoDelMotivo(motivo: MotivoNoDisponible | null): string {
  return motivo === null ? '' : MOTIVOS[motivo]
}

/** Estado de un ejemplar concreto, para el detalle de la obra. */
export function textoDelEstadoDeEjemplar(estado: EstadoEjemplar): string {
  return ESTADOS_DE_EJEMPLAR[estado]
}

/** Dónde coincidió el término buscado (HU-02: «el tema que coincidió»). */
export function textoDeLaCoincidencia(
  donde: 'title' | 'author' | 'subject' | null,
): string {
  if (donde === 'title') return 'Coincide en el título'
  if (donde === 'author') return 'Coincide en el autor'
  if (donde === 'subject') return 'Coincide en el tema'
  return ''
}

/** Marcador estático del buscador (visible con movimiento reducido y para lectores). */
export const PLACEHOLDER_BUSCADOR = 'Por ejemplo: cien años de soledad'

/**
 * Guion del mini tutorial que se escribe solo en el campo de búsqueda. Entre
 * dos frases se borra solo lo que no comparten («Busque por título» pasa a
 * «Busque por autor» borrando únicamente «título») y la última vuelve a la primera.
 */
export const GUION_BUSCADOR: readonly string[] = [
  '¿Qué busca hoy?',
  'Busque por título',
  'Busque por autor',
  'Busque por tema',
  'Busque por palabras clave',
  'Pruebe con una idea: libros sobre el mar',
  'Filtre por sala o categoría',
]

/** Texto que se copia: «Sala X › Sección Y › Estante Z». */
export function textoDeUbicacion(u: {
  room: string
  section: string
  shelf: string
}): string {
  return `${u.room} › Sección ${u.section} › Estante ${u.shelf}`
}
