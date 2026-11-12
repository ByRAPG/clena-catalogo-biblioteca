import { useState, type FormEvent } from 'react'
import {
  Alert,
  Anchor,
  Button,
  FileInput,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { Link } from 'react-router-dom'
import { useSesion } from '../auth/sesion-context'
import { apiUrl } from '../../shared/api/client'
import {
  importarCatalogo,
  type ReporteImportacion,
} from './importar-catalogo.api'

export function PaginaImportacion() {
  const { sesion } = useSesion()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [reporte, setReporte] = useState<ReporteImportacion | null>(null)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function importar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!archivo || !sesion || ocupado) return
    setError('')
    setReporte(null)
    if (!archivo.name.toLowerCase().endsWith('.csv')) {
      setError(
        'Seleccione un archivo CSV. Puede guardar su archivo Excel como CSV UTF-8.',
      )
      return
    }
    if (archivo.size > 1000000) {
      setError('El archivo debe ocupar como máximo 1 MB.')
      return
    }
    setOcupado(true)
    try {
      const contenido = await archivo.text()
      const resultado = await importarCatalogo(
        contenido,
        archivo.name,
        sesion.token,
      )
      setReporte(resultado)
    } catch (causa: unknown) {
      setError(
        causa instanceof Error
          ? causa.message
          : 'No se pudo completar la importación',
      )
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Stack gap="lg">
      <Title order={2}>Importar catálogo desde CSV</Title>
      <Text>
        Las filas válidas se importan aunque otras tengan errores. Puede guardar
        un archivo Excel como CSV UTF-8.
      </Text>
      <Anchor
        href={`${apiUrl}/catalog/imports/template`}
        download="plantilla-catalogo.csv"
      >
        Descargar plantilla de ejemplo
      </Anchor>
      <Text>
        Use datos bibliográficos ficticios o autorizados. No incluya datos
        personales de lectores.
      </Text>
      <Anchor component={Link} to="/privacidad">
        Consultar aviso de privacidad
      </Anchor>
      <form onSubmit={importar}>
        <Stack>
          <FileInput
            label="Archivo CSV"
            description="CSV UTF-8 separado por comas. Máximo 1 MB."
            accept=".csv,text/csv"
            value={archivo}
            disabled={ocupado}
            onChange={(nuevo) => {
              setArchivo(nuevo)
              setReporte(null)
              setError('')
            }}
          />
          <Button type="submit" loading={ocupado} disabled={!archivo}>
            Importar
          </Button>
        </Stack>
      </form>
      {error && (
        <Alert role="alert" color="red" title="No se completó la importación">
          {error}
        </Alert>
      )}
      {reporte && (
        <Stack>
          <Text role="status">
            Ejemplares creados: {reporte.created}. Actualizados:{' '}
            {reporte.updated}. Filas con errores: {reporte.failed}.
          </Text>
          <Table.ScrollContainer minWidth={500}>
            <Table captionSide="top">
              <Table.Caption>Reporte de importación por fila</Table.Caption>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Fila</Table.Th>
                  <Table.Th>Resultado</Table.Th>
                  <Table.Th>Detalle</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {reporte.rows.map((fila) => (
                  <Table.Tr key={fila.row}>
                    <Table.Td>{fila.row}</Table.Td>
                    <Table.Td>
                      {fila.status === 'created'
                        ? 'Creado'
                        : fila.status === 'updated'
                          ? 'Actualizado'
                          : 'Error'}
                    </Table.Td>
                    <Table.Td>
                      {fila.status === 'failed'
                        ? `${fila.field ? `${fila.field}: ` : ''}${fila.error}`
                        : 'Importado correctamente'}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Stack>
      )}
    </Stack>
  )
}
