import { Anchor, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useSesion } from '../auth/sesion-context'
import { SeccionCodigosQr } from '../qr/seccion-codigos-qr'

/** Pantalla del personal: alta y edición del catálogo (HU-10, HU-11, HU-19). */
export function PaginaGestion() {
  const { sesion } = useSesion()
  return (
    <Stack gap="xl">
      <Stack gap="md">
        <Title order={2}>Gestión del catálogo</Title>
        <Text>Solo visible para el personal del CLENA.</Text>
        <Anchor component={Link} to="/gestion/registrar-libro">
          Registrar un libro nuevo
        </Anchor>
        {sesion?.rol === 'ADMIN' && (
          <Anchor component={Link} to="/gestion/importar">
            Importar catálogo desde CSV
          </Anchor>
        )}
      </Stack>
      <SeccionCodigosQr />
    </Stack>
  )
}
