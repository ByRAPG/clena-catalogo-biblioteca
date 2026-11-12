import { Badge, Text } from '@mantine/core'
import type { Disponibilidad } from './busqueda.api'
import { textoDelMotivo } from './textos'

/**
 * Disponibilidad de la obra (HU-06). La información va en el **texto**, no solo
 * en el color: quien no distingue verde de naranja lee «Disponible» o
 * «No disponible» igual.
 *
 * Los colores no salen de la escala de Mantine porque ninguno de sus tonos de
 * verde ni de naranja llega a 4,5:1 (el más oscuro, `green.9`, da 4,37:1 con
 * texto blanco). Estos pares sí cumplen WCAG AA con holgura:
 * - verde   #14532d sobre #ebfbee = 8,49:1
 * - naranja #7c2d12 sobre #fff4e6 = 8,63:1
 */
const COLORES = {
  DISPONIBLE: { texto: '#14532d', fondo: '#ebfbee' },
  NO_DISPONIBLE: { texto: '#7c2d12', fondo: '#fff4e6' },
} as const

export function EtiquetaDisponibilidad({
  disponibilidad,
}: {
  disponibilidad: Disponibilidad
}) {
  const { status, reason, availableCopies, totalCopies } = disponibilidad
  const disponible = status === 'DISPONIBLE'
  const color = COLORES[status]
  const motivo = textoDelMotivo(reason)

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}
    >
      <Badge
        size="lg"
        radius="sm"
        variant="filled"
        style={{
          backgroundColor: color.fondo,
          color: color.texto,
          textTransform: 'none',
          fontWeight: 700,
        }}
      >
        {disponible ? 'Disponible' : 'No disponible'}
      </Badge>
      {motivo !== '' && (
        <Text component="span" c="dark.8">
          {motivo}
        </Text>
      )}
      {disponible && (
        <Text component="span" c="dark.8">
          {availableCopies} de {totalCopies}{' '}
          {totalCopies === 1 ? 'ejemplar' : 'ejemplares'}
        </Text>
      )}
    </span>
  )
}
