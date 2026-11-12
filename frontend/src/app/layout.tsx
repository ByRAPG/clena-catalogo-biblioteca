import { useState } from 'react'
import {
  Alert,
  Anchor,
  Box,
  Button,
  Container,
  Group,
  Stack,
  Title,
} from '@mantine/core'
import { Link, Outlet } from 'react-router-dom'
import { AccesibilidadProvider } from '../features/accessibility/accesibilidad-provider'
import { ControlesAccesibilidad } from '../features/accessibility/controles-accesibilidad'
import { useSesion } from '../features/auth/sesion-context'
import { peticion } from '../shared/api/client'

export function Layout() {
  const { sesion, cerrarSesion } = useSesion()
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [errorCierre, setErrorCierre] = useState('')

  async function salir() {
    if (cerrandoSesion) return
    setCerrandoSesion(true)
    setErrorCierre('')
    try {
      await peticion<void>('/auth/logout', { metodo: 'POST' })
      cerrarSesion()
    } catch (causa: unknown) {
      setErrorCierre(
        causa instanceof Error
          ? causa.message
          : 'No se pudo cerrar la sesión. Inténtalo de nuevo.',
      )
    } finally {
      setCerrandoSesion(false)
    }
  }

  return (
    <AccesibilidadProvider>
      <Anchor href="#contenido" className="salto-al-contenido">
        Saltar al contenido
      </Anchor>

      <Box component="header" bg="blue.8" c="white" py="md">
        <Container size="lg">
          <Stack gap="xs">
            <Group justify="space-between">
              <Title order={1} size="h2">
                <Anchor component={Link} to="/" c="white" underline="never">
                  Biblioteca del CLENA
                </Anchor>
              </Title>
              <Group>
                <Anchor component={Link} to="/gestion" c="white">
                  Gestión
                </Anchor>
                {!sesion && (
                  <Anchor component={Link} to="/ingresar" c="white">
                    Ingresar
                  </Anchor>
                )}
                {sesion && (
                  <Button
                    variant="white"
                    onClick={() => void salir()}
                    loading={cerrandoSesion}
                  >
                    Cerrar sesión
                  </Button>
                )}
              </Group>
            </Group>
            {errorCierre && (
              <Alert role="alert" color="red" title="No se pudo cerrar sesión">
                {errorCierre}
              </Alert>
            )}
          </Stack>
        </Container>
      </Box>

      <Container size="lg" py="xs">
        <ControlesAccesibilidad />
      </Container>

      <Container component="main" id="contenido" size="lg" py="xl">
        <Outlet />
      </Container>
      <Container component="footer" size="lg" py="md">
        <Anchor component={Link} to="/privacidad">
          Aviso de privacidad
        </Anchor>
      </Container>
    </AccesibilidadProvider>
  )
}
