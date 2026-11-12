import { Text } from '@mantine/core'
import type { Ubicacion } from './busqueda.api'

/**
 * Sala, sección y estante (HU-03). Se nombra cada parte para que la persona
 * sepa qué buscar en la señalización de la biblioteca, en vez de leer
 * «Sala General · A-03» y tener que adivinar.
 *
 * El nombre de la sala se imprime tal cual, sin anteponerle «Sala»: en el
 * catálogo ya se llaman «Sala General», «Sala Caribe» o «Sala Infantil», y
 * repetir la palabra daría «Sala Sala General».
 */
export function UbicacionObra({
  ubicacion,
  tamano = 'md',
}: {
  ubicacion: Ubicacion | null
  tamano?: 'md' | 'lg'
}) {
  if (ubicacion === null) {
    return <Text fz={tamano}>Sin ubicación registrada.</Text>
  }

  return (
    <Text fz={tamano}>
      <strong>{ubicacion.room}</strong>, sección{' '}
      <strong>{ubicacion.section}</strong>, estante{' '}
      <strong>{ubicacion.shelf}</strong>
    </Text>
  )
}
