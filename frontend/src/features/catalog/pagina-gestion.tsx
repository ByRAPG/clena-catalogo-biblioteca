import { Stack, Text, Title } from '@mantine/core'

/** Pantalla del personal: alta y edición del catálogo (HU-10, HU-11, HU-19). */
export function PaginaGestion() {
  return (
    <Stack gap="md">
      <Title order={2}>Gestión del catálogo</Title>
      <Text>Solo visible para el personal del CLENA.</Text>
    </Stack>
  )
}
