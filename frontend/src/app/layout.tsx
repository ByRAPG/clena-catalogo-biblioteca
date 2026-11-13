import { useState } from 'react'
import {
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

export function Layout() {
  const { sesion, recuperando, cerrarSesion } = useSesion()
  const [cerrandoSesion, setCerrandoSesion] = useState(false)

  async function salir() {
    if (cerrandoSesion) return
    setCerrandoSesion(true)
    try {
      await cerrarSesion()
    } catch {
      // Si el backend no responde, `cerrarSesion` igual deja la sesión cerrada
      // en este navegador: no hay nada más que mostrar.
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
                {!recuperando && !sesion && (
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
