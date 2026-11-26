import { Anchor, Button, List, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import { TEMAS_PORTADA, rutaDelTema } from './temas-portada'

/**
 * Bloque que aparece cuando la búsqueda no devuelve nada (HU-07).
 *
 * Decisiones:
 * - Sin `role="status"` en la sección (F1 de la revisión del PR #157): el
 *   conteo ya lo anuncia la región `aria-live` de arriba, y marcar todo el
 *   bloque hacía que el lector leyera de un tirón el título, las sugerencias,
 *   el botón y los tres temas a quien acaba de fallar una búsqueda. La sección
 *   queda con `aria-labelledby`, así se encuentra navegando por regiones y se
 *   lee cuando la persona decide leerla.
 * - La consulta se repite tal como se escribió. Si alguien buscó «Gabrial
 *   García» y lo ve escrito, descubre el error sin que haya que señalárselo.
 * - Cada sugerencia es accionable o comprobable: el botón quita los filtros y
 *   los tres temas son enlaces de verdad, no texto que invite a volver a
 *   escribir. El foco se ve en todos ellos por la regla `:focus-visible`
 *   global de `index.css`.
 * - «Quitar filtros» solo se muestra si hay filtros puestos: ofrecer quitar lo
 *   que no existe hace pensar que el problema está ahí.
 */
export function SinResultados({
  consulta,
  hayFiltros,
  alQuitarFiltros,
}: {
  /** Lo que la persona escribió; cadena vacía si solo aplicó filtros. */
  consulta: string
  hayFiltros: boolean
  /** Limpia los filtros de la URL y repite la búsqueda. */
  alQuitarFiltros: () => void
}) {
  return (
    <section aria-labelledby="titulo-sin-resultados">
      <Stack gap="md" align="flex-start">
        <Stack gap="xs">
          <Title id="titulo-sin-resultados" order={2} size="h3">
            {consulta === ''
              ? 'No encontramos libros con esos filtros'
              : 'No encontramos libros para lo que buscó'}
          </Title>
          {consulta !== '' && (
            <Text fz="lg">
              Buscó: <Text component="span" fw={700}>«{consulta}»</Text>
            </Text>
          )}
        </Stack>

        <Stack gap="xs">
          <Text fw={600}>Puede intentar esto:</Text>
          <List spacing="xs">
            <List.Item>
              Revise la ortografía de lo que escribió, sobre todo los nombres y
              los apellidos.
            </List.Item>
            <List.Item>
              Use palabras más generales: busque «mar» en vez de «las mareas del
              Caribe».
            </List.Item>
            {hayFiltros && (
              <List.Item>
                Quite los filtros de categoría, sala y disponibilidad: puede que
                el libro esté en otra sala.
              </List.Item>
            )}
          </List>
        </Stack>

        {hayFiltros && (
          <Button
            type="button"
            variant="default"
            onClick={alQuitarFiltros}
            style={{ minHeight: 44 }}
          >
            Quitar los filtros y buscar de nuevo
          </Button>
        )}

        <Stack gap="xs">
          <Text fw={600} id="temas-sin-resultados">
            O empiece por un tema:
          </Text>
          <List
            spacing="xs"
            listStyleType="none"
            aria-labelledby="temas-sin-resultados"
          >
            {TEMAS_PORTADA.map((tema) => (
              <List.Item key={tema}>
                <Anchor component={Link} to={rutaDelTema(tema)} fw={600}>
                  {tema}
                </Anchor>
              </List.Item>
            ))}
          </List>
        </Stack>

        <Text>También puede pedir ayuda en el mostrador de la biblioteca.</Text>
      </Stack>
    </section>
  )
}
