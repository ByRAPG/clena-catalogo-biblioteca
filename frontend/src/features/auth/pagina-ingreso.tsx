import { Stack, Text, Title } from '@mantine/core'

/** Inicio de sesión del personal. El formulario y el JWT llegan con HU-09. */
export function PaginaIngreso() {
  return (
    <Stack gap="md">
      <Title order={2}>Ingresar</Title>
      <Text>Acceso para el personal de la biblioteca.</Text>
    </Stack>
  )
}
