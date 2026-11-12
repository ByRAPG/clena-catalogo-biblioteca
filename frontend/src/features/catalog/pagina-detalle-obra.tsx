import {
  Alert,
  Anchor,
  Button,
  Card,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '../../shared/api/client'
import { obtenerObra, type ObraDetalle } from '../search/busqueda.api'
import { EtiquetaDisponibilidad } from '../search/etiqueta-disponibilidad'
import { textoDelEstadoDeEjemplar } from '../search/textos'

/**
 * Detalle público de una obra (HU-03, HU-06). Muestra la ubicación de **cada**
 * ejemplar en letra grande, porque un mismo libro puede estar en estantes
 * distintos, y el botón «Ver versión digital» cuando la obra la tiene.
 *
 * Los datos se piden a `GET /search/works/:id`. Un id que no es UUID responde
 * 400 y uno que no existe 404: los dos se traducen a un mensaje legible.
 */
function mensajeDeFallo(causa: unknown): string {
  if (causa instanceof ApiError) {
    if (causa.esFalloDeRed) {
      return 'No pudimos conectarnos con el servidor. Revise su conexión e intente de nuevo.'
    }
    if (causa.statusCode === 404 || causa.statusCode === 400) {
      return 'No encontramos esta obra en el catálogo. Puede que el enlace esté equivocado.'
    }
    return `No pudimos cargar la obra. ${causa.message}`
  }
  return 'No pudimos cargar la obra. Intente de nuevo.'
}

/** Última respuesta recibida, junto con el id que la produjo. */
interface RespuestaRecibida {
  id: string
  obra: ObraDetalle | null
  error: string | null
}

export function PaginaDetalleObra() {
  const { id = '' } = useParams<{ id: string }>()
  const [recibida, setRecibida] = useState<RespuestaRecibida | null>(null)

  // «Cargando» se deduce de comparar el id de la URL con el de la última
  // respuesta, en vez de guardarlo: así el efecto no llama a setState de forma
  // síncrona, que es lo que provoca renders en cascada.
  const alDia = recibida !== null && recibida.id === id
  const cargando = !alDia
  const obra = alDia ? recibida.obra : null
  const error = alDia ? recibida.error : null

  useEffect(() => {
    if (id === '') return
    const controlador = new AbortController()

    obtenerObra(id, controlador.signal)
      .then((encontrada) => {
        if (controlador.signal.aborted) return
        setRecibida({ id, obra: encontrada, error: null })
      })
      .catch((causa: unknown) => {
        if (controlador.signal.aborted) return
        setRecibida({ id, obra: null, error: mensajeDeFallo(causa) })
      })

    return () => controlador.abort()
  }, [id])

  if (cargando) {
    return (
      <Group gap="sm" aria-live="polite">
        <Loader size="sm" />
        <Text>Cargando la obra…</Text>
      </Group>
    )
  }

  if (error !== null) {
    return (
      <Stack gap="md" align="flex-start">
        <Alert color="red.9" title="No se pudo cargar" role="alert">
          {error}
        </Alert>
        <Anchor component={Link} to="/">
          Volver al catálogo
        </Anchor>
      </Stack>
    )
  }

  if (obra === null) return null

  const autores =
    obra.authors.length > 0 ? obra.authors.join(', ') : 'Autor no registrado'

  return (
    <Stack gap="lg">
      <Anchor component={Link} to="/">
        Volver al catálogo
      </Anchor>

      <Stack gap="xs">
        <Title order={2}>{obra.title}</Title>
        {obra.subtitle !== null && <Text fz="lg">{obra.subtitle}</Text>}
        <Text fz="lg">
          <Text component="span" fw={600}>
            Autor:{' '}
          </Text>
          {autores}
        </Text>
        {obra.subjects.length > 0 && (
          <Text fz="lg">
            <Text component="span" fw={600}>
              Temas:{' '}
            </Text>
            {obra.subjects.join(', ')}
          </Text>
        )}
      </Stack>

      <EtiquetaDisponibilidad disponibilidad={obra.availability} />

      {obra.digitalUrl !== null && (
        <Button
          component="a"
          href={obra.digitalUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ minHeight: 44, alignSelf: 'flex-start' }}
        >
          Ver versión digital
        </Button>
      )}

      <Card withBorder padding="lg" radius="md">
        <Stack gap="sm">
          <Title order={3} size="h3">
            Datos de la obra
          </Title>
          <Table withRowBorders={false} verticalSpacing="xs">
            <Table.Tbody>
              {obra.category !== null && (
                <Table.Tr>
                  <Table.Th scope="row">Categoría</Table.Th>
                  <Table.Td>{obra.category.name}</Table.Td>
                </Table.Tr>
              )}
              {obra.year !== null && (
                <Table.Tr>
                  <Table.Th scope="row">Año</Table.Th>
                  <Table.Td>{obra.year}</Table.Td>
                </Table.Tr>
              )}
              {obra.publisher !== null && (
                <Table.Tr>
                  <Table.Th scope="row">Editorial</Table.Th>
                  <Table.Td>{obra.publisher}</Table.Td>
                </Table.Tr>
              )}
              {obra.isbn !== null && (
                <Table.Tr>
                  <Table.Th scope="row">ISBN</Table.Th>
                  <Table.Td>{obra.isbn}</Table.Td>
                </Table.Tr>
              )}
              {obra.classification !== null && (
                <Table.Tr>
                  <Table.Th scope="row">Clasificación</Table.Th>
                  <Table.Td>{obra.classification}</Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>

      <Stack gap="sm">
        <Title order={3} size="h3">
          Dónde encontrarlo
        </Title>
        {obra.copies.length === 0 ? (
          <Text fz="lg">Esta obra no tiene ejemplares registrados.</Text>
        ) : (
          <Stack
            component="ul"
            gap="sm"
            style={{ listStyle: 'none', margin: 0, padding: 0 }}
          >
            {obra.copies.map((ejemplar) => (
              <Card
                component="li"
                key={ejemplar.inventoryCode}
                withBorder
                padding="md"
                radius="md"
              >
                <Stack gap={4}>
                  <Text fz="lg" fw={700}>
                    {ejemplar.room}
                  </Text>
                  <Text fz="lg">
                    Sección {ejemplar.section}, estante {ejemplar.shelf}
                  </Text>
                  <Text>
                    Ejemplar {ejemplar.inventoryCode} ·{' '}
                    {textoDelEstadoDeEjemplar(ejemplar.status)}
                  </Text>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
