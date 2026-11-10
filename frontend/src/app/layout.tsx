import { Anchor, Box, Container, Group, Title } from '@mantine/core'
import { Link, Outlet } from 'react-router-dom'

/**
 * Marco común de las pantallas públicas. El enlace «Saltar al contenido» es
 * requisito de accesibilidad: aparece al tabular y lleva directo al <main>.
 */
export function Layout() {
  return (
    <>
      <Anchor href="#contenido" className="salto-al-contenido">
        Saltar al contenido
      </Anchor>

      <Box component="header" bg="blue.8" c="white" py="md">
        <Container size="lg">
          <Group justify="space-between">
            <Title order={1} size="h2">
              <Anchor component={Link} to="/" c="white" underline="never">
                Biblioteca del CLENA
              </Anchor>
            </Title>
            <Anchor component={Link} to="/ingresar" c="white">
              Ingresar
            </Anchor>
          </Group>
        </Container>
      </Box>

      <Container component="main" id="contenido" size="lg" py="xl">
        <Outlet />
      </Container>
    </>
  )
}
