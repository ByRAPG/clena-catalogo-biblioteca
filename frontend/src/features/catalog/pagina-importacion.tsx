import { useState, type FormEvent } from 'react'
import {
  Alert,
  Anchor,
  Button,
  FileInput,
  Group,
  Table,
  Text,
} from '@mantine/core'
import { Link } from 'react-router-dom'
import { EncabezadoSeccion } from '../../shared/ui/encabezado-seccion'
import { IconoAlerta, IconoArchivo } from '../../shared/ui/iconos'
import { useSesion } from '../auth/sesion-context'
import { apiUrl } from '../../shared/api/client'
import {
  importarCatalogo,
  type ReporteImportacion,
} from './importar-catalogo.api'
import { leerArchivoCsv } from './decodificar-csv'

const EXTENSIONES_PERMITIDAS = /\.(csv|tsv|txt)$/i
const MAX_TAMANO_BYTES = 1_000_000

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
    if (!EXTENSIONES_PERMITIDAS.test(archivo.name)) {
      setError(
        'Seleccione un archivo .csv, .tsv o .txt guardado desde Excel o su sistema de biblioteca.',
      )
      return
    }
    if (archivo.size > MAX_TAMANO_BYTES) {
      setError('El archivo supera el tamaño máximo permitido de 1 MB.')
      return
    }
    setOcupado(true)
    try {
      const contenido = await leerArchivoCsv(archivo)
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
    <div className="pantalla-gestion pantalla-formulario">
      <EncabezadoSeccion
        migas={[
          { texto: 'Inicio', to: '/' },
          { texto: 'Gestión', to: '/gestion' },
          { texto: 'Importar catálogo' },
        ]}
        volver={{ texto: 'Volver al panel de gestión', to: '/gestion' }}
        foto="interior"
        tono="marino"
        rotulo="Administración"
        titulo="Importar catálogo desde CSV"
        descripcion="Acepta archivos de Excel en español (UTF-8 con o sin BOM y Windows-1252), separados por coma, punto y coma o tabulador, con cabeceras en cualquier orden. Las filas válidas se importan aunque otras tengan errores."
      />

      <section aria-labelledby="titulo-pasos" className="pasos-seccion">
        <h2 id="titulo-pasos" className="rotulo">
          Antes de subir el archivo
        </h2>
        <ol className="pasos-tarjetas">
          <li className="paso-tarjeta paso-marino">
            <Anchor
              href={`${apiUrl}/catalog/imports/template`}
              download="plantilla-catalogo.csv"
            >
              Descargar plantilla de ejemplo
            </Anchor>
          </li>
          <li className="paso-tarjeta paso-granate">
            <Text component="span">
              Admite alias de cabeceras (como Título/Title o Año/Year), hasta
              5 000 filas y máximo 1 MB. No incluya datos personales de
              lectores.
            </Text>
          </li>
          <li className="paso-tarjeta paso-ambar">
            <Anchor component={Link} to="/privacidad">
              Consultar aviso de privacidad
            </Anchor>
          </li>
        </ol>
      </section>

      <form onSubmit={importar} className="formulario-tarjeta formulario-archivo">
        <div className="zona-archivo">
          <FileInput
            label="Archivo CSV o TSV"
            description="UTF-8 (con o sin BOM) o Windows-1252; separador coma, punto y coma o tabulador. Máximo 1 MB y 5 000 filas."
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
            value={archivo}
            disabled={ocupado}
            leftSection={<IconoArchivo size={20} />}
            onChange={(nuevo) => {
              setArchivo(nuevo)
              setReporte(null)
              setError('')
            }}
          />
        </div>
        <div className="acciones-formulario">
          <Button type="submit" loading={ocupado} disabled={!archivo} size="lg">
            Importar
          </Button>
        </div>
        {ocupado && (
          <p className="aviso-discreto" role="status">
            Importando el archivo, puede tardar unos segundos…
          </p>
        )}
      </form>

      {error && (
        <Alert
          role="alert"
          color="red"
          className="alerta-error"
          title="No se completó la importación"
          icon={<IconoAlerta />}
        >
          {error}
        </Alert>
      )}
      {reporte && (
        <section className="tarjeta-seccion" aria-label="Resultado de la importación">
          <Text role="status">
            {reporte.works && reporte.copies
              ? `Libros creados: ${reporte.works.created}. Ejemplares creados: ${reporte.copies.created}. `
              : `Filas creadas: ${reporte.created}. `}
            Filas actualizadas: {reporte.updated}. Filas con errores:{' '}
            {reporte.failed}.
          </Text>
          <div className="cifras" aria-hidden="true">
            <div className="cifra cifra-azul">
              <strong>{reporte.created}</strong>
              <span>Creados</span>
            </div>
            <div className="cifra cifra-granate">
              <strong>{reporte.updated}</strong>
              <span>Actualizados</span>
            </div>
            <div className="cifra cifra-ambar">
              <strong>{reporte.failed}</strong>
              <span>Con errores</span>
            </div>
          </div>
          <Group gap="sm">
            <Button
              type="button"
              variant="default"
              style={{ minHeight: 44 }}
              onClick={() => {
                setReporte(null)
                setArchivo(null)
                setError('')
                window.scrollTo({ top: 0 })
              }}
            >
              Importar otro archivo
            </Button>
            <Button
              component={Link}
              to="/gestion"
              variant="default"
              style={{ minHeight: 44 }}
            >
              Volver al panel de gestión
            </Button>
          </Group>
          {reporte.rows.length === 0 ? (
            <Text>El archivo no tenía filas para importar.</Text>
          ) : (
            <Table className="tabla-gestion" captionSide="top">
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
                    <Table.Td data-etiqueta="Fila">{fila.row}</Table.Td>
                    <Table.Td data-etiqueta="Resultado">
                      <span
                        className={`estado estado-${fila.status === 'failed' ? 'error' : 'ok'}`}
                      >
                        <span aria-hidden="true">
                          {fila.status === 'failed' ? '✕' : '✓'}
                        </span>
                        {fila.status === 'created'
                          ? 'Creado'
                          : fila.status === 'updated'
                            ? 'Actualizado'
                            : 'Error'}
                      </span>
                    </Table.Td>
                    <Table.Td data-etiqueta="Detalle">
                      {fila.status === 'failed'
                        ? `${fila.field ? `${fila.field}: ` : ''}${fila.error}`
                        : 'Importado correctamente'}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </section>
      )}
    </div>
  )
}
