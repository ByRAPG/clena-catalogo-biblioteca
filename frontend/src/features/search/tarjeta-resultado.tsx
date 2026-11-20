import { Anchor, Group, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import { Resaltado } from '../../shared/ui/resaltado'
import type { ObraResumen } from './busqueda.api'
import { EtiquetaDisponibilidad } from './etiqueta-disponibilidad'
import { textoDeLaCoincidencia } from './textos'
import { UbicacionObra } from './ubicacion-obra'

/**
 * Un resultado de la búsqueda (HU-01, HU-02, HU-03, HU-06). Muestra el título
 * como enlace al detalle, el autor, el tema que coincidió, la disponibilidad
 * en texto y la ubicación. Los términos de la consulta van resaltados.
 *
 * El título es un <h2> dentro de un <li>: la lista de resultados es un <ul>, y
 * así un lector de pantalla puede saltar de resultado en resultado. El filete
 * lateral y el número van en granate y pasan a ámbar al pasar el cursor o enfocar.
 */
export function TarjetaResultado({
  obra,
  consulta = '',
  numero,
}: {
  obra: ObraResumen
  consulta?: string
  /** Posición del resultado en toda la búsqueda (1, 2, 3…). */
  numero?: number
}) {
  const coincidencia = textoDeLaCoincidencia(obra.matchedOn)
  const autores = obra.authors.length > 0 ? obra.authors.join(', ') : 'Autor no registrado'

  return (
    <li className="resultado">
      <Stack gap="xs">
        <Group gap="sm" align="flex-start" wrap="nowrap">
          {numero !== undefined && (
            <span className="resultado-numero" aria-hidden="true">
              {String(numero).padStart(2, '0')}
            </span>
          )}
          <Title order={2} size="h3" style={{ flex: 1, minWidth: 0 }}>
            <Anchor component={Link} to={`/obras/${obra.id}${consulta === '' ? '' : `?q=${encodeURIComponent(consulta)}`}`} fw={700}>
              <Resaltado texto={obra.title} consulta={consulta} />
            </Anchor>
          </Title>
        </Group>

        {obra.matchSource === 'semantic' && (
          <span>
            <span className="insignia-significado">Coincide por significado</span>
          </span>
        )}

        <Text>
          <Text component="span" c="dark.8" fw={600}>
            Autor:{' '}
          </Text>
          <Resaltado texto={autores} consulta={consulta} />
        </Text>

        {obra.subjects.length > 0 && (
          <Text>
            <Text component="span" c="dark.8" fw={600}>
              Tema:{' '}
            </Text>
            <Resaltado texto={obra.subjects.join(', ')} consulta={consulta} />
          </Text>
        )}

        <Group gap="sm" wrap="wrap">
          {obra.category !== null && <Text>Categoría: {obra.category.name}</Text>}
          {obra.year !== null && <Text>Año: {obra.year}</Text>}
        </Group>

        {coincidencia !== '' && (
          <p className="coincidencia">
            Coincide en{' '}
            <span className="coincidencia-campo">{coincidencia.replace('Coincide en ', '')}</span>
          </p>
        )}

        <EtiquetaDisponibilidad disponibilidad={obra.availability} />
        <UbicacionObra ubicacion={obra.location} />
      </Stack>
    </li>
  )
}
