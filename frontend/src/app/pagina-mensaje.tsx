import { Stack, Text, Title } from '@mantine/core'

/** Pantallas de 404 y 403, con el mismo marco que el resto. */
export function PaginaMensaje({
  titulo,
  detalle,
}: {
  titulo: string
  detalle: string
}) {
  return (
    <Stack gap="md">
      <Title order={2}>{titulo}</Title>
      <Text>{detalle}</Text>
    </Stack>
  )
}
