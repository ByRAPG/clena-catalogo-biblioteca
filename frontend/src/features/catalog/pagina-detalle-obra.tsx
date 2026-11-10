import { Stack, Text, Title } from '@mantine/core'
import { useParams } from 'react-router-dom'

/** Detalle público de una obra: ubicación y disponibilidad (HU-03, HU-06). */
export function PaginaDetalleObra() {
  const { id } = useParams<{ id: string }>()

  return (
    <Stack gap="md">
      <Title order={2}>Detalle de la obra</Title>
      <Text>Obra solicitada: {id}</Text>
    </Stack>
  )
}
