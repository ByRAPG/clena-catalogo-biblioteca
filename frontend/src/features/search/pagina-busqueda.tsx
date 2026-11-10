import { Stack, Text, Title } from '@mantine/core'

/**
 * Pantalla pública de búsqueda. El campo, los filtros y los resultados llegan
 * con HU-01, HU-02 y HU-08, cuando exista el endpoint del módulo `search`.
 */
export function PaginaBusqueda() {
  return (
    <Stack gap="md">
      <Title order={2}>Catálogo CLENA</Title>
      <Text>
        Busque un libro por título, autor o tema y vea en qué sala, sección y
        estante está.
      </Text>
    </Stack>
  )
}
