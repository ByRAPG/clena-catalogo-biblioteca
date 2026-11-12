import { Anchor, Card, Group, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import type { ObraResumen } from './busqueda.api'
import { EtiquetaDisponibilidad } from './etiqueta-disponibilidad'
import { textoDeLaCoincidencia } from './textos'
import { UbicacionObra } from './ubicacion-obra'

/**
 * Un resultado de la búsqueda (HU-01, HU-02, HU-03, HU-06). Muestra el título
 * como enlace al detalle, el autor, el tema que coincidió, la disponibilidad
 * en texto y la ubicación.
 *
 * El título es un <h3> dentro de un <li>: la lista de resultados es un <ul>, y
 * así un lector de pantalla puede saltar de resultado en resultado.
 */
export function TarjetaResultado({ obra }: { obra: ObraResumen }) {
  const coincidencia = textoDeLaCoincidencia(obra.matchedOn)
  const autores = obra.authors.length > 0 ? obra.authors.join(', ') : 'Autor no registrado'

  return (
    <Card component="li" withBorder padding="lg" radius="md">
      <Stack gap="xs">
        <Title order={3} size="h3">
          <Anchor component={Link} to={`/obras/${obra.id}`} fw={700}>
            {obra.title}
          </Anchor>
        </Title>

        <Text>
          <Text component="span" c="dark.8" fw={600}>
            Autor:{' '}
          </Text>
          {autores}
        </Text>

        {obra.subjects.length > 0 && (
          <Text>
            <Text component="span" c="dark.8" fw={600}>
              Tema:{' '}
            </Text>
            {obra.subjects.join(', ')}
          </Text>
        )}

        <Group gap="sm" wrap="wrap">
          {obra.category !== null && <Text>Categoría: {obra.category.name}</Text>}
          {obra.year !== null && <Text>Año: {obra.year}</Text>}
        </Group>

        {coincidencia !== '' && (
          <Text fz="sm" c="dark.8" fs="italic">
            {coincidencia}
          </Text>
        )}

        <EtiquetaDisponibilidad disponibilidad={obra.availability} />
        <UbicacionObra ubicacion={obra.location} />
      </Stack>
    </Card>
  )
}
