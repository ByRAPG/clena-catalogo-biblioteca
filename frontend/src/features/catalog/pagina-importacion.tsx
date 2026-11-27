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
  descargarErroresCsv,
  importarCatalogo,
  simularImportacion,
  type ReporteImportacion,
} from './importar-catalogo.api'
import { leerArchivoCsv } from './decodificar-csv'

const EXTENSIONES_PERMITIDAS = /\.(csv|tsv|txt)$/i
const MAX_TAMANO_BYTES = 1_000_000

const MAX_ERRORES_VISIBLES = 50

/** Deja todas las filas correctas y solo las primeras 50 con error. */
function acotarErrores<T extends { status: string }>(filas: T[]) {
  let fallidas = 0
  const visibles = filas.filter((f) => f.status !== 'failed' || ++fallidas <= MAX_ERRORES_VISIBLES)
  return { visibles, ocultas: Math.max(0, fallidas - MAX_ERRORES_VISIBLES) }
}

function AvisoErroresOcultos({ n }: { n: number }) {
  return n > 0 ? <Text>Y {n} filas más: descargue el CSV de errores</Text> : null
}

export function PaginaImportacion() {
  const { sesion } = useSesion()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [reporte, setReporte] = useState<ReporteImportacion | null>(null)
  const [error, setError] = useState('')
  const [vistaPrevia, setVistaPrevia] = useState<ReporteImportacion | null>(
    null,
  )
  const [contenido, setContenido] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [descargando, setDescargando] = useState(false)

  function reiniciar() {
    setReporte(null)
    setVistaPrevia(null)
    setError('')
  }

  async function descargarErrores(origen: ReporteImportacion | null) {
    if (!sesion || !archivo || !origen || descargando) return
    setDescargando(true)
    setError('')
    try {
      const blob = await descargarErroresCsv(sesion.token, {
        importId: origen.dryRun ? undefined : origen.importId,
        content: contenido,
        fileName: archivo.name,
      })
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = 'errores-importacion.csv'
      document.body.appendChild(enlace)
      enlace.click()
      enlace.remove()
      URL.revokeObjectURL(url)
    } catch (causa: unknown) {
      setError(
        causa instanceof Error
          ? causa.message
          : 'No se pudo descargar el informe de errores',
      )
    } finally {
      setDescargando(false)
    }
  }

  async function procesar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!archivo || !sesion || ocupado) return
    reiniciar()
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
      const texto = await leerArchivoCsv(archivo)
      setContenido(texto)
      setVistaPrevia(await simularImportacion(texto, archivo.name, sesion.token))
    } catch (causa: unknown) {
      setError(
        causa instanceof Error
          ? causa.message
          : 'No se pudo simular la importación',
      )
    } finally {
      setOcupado(false)
    }
  }

  async function confirmar() {
    if (!archivo || !sesion || ocupado || !vistaPrevia) return
    setError('')
    setOcupado(true)
    try {
      const resultado = await importarCatalogo(
        contenido,
        archivo.name,
        sesion.token,
      )
      setReporte(resultado)
      setVistaPrevia(null)
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

      <form onSubmit={procesar} className="formulario-tarjeta formulario-archivo">
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
              reiniciar()
            }}
          />
        </div>
        <div className="acciones-formulario">
          <Button type="submit" loading={ocupado} disabled={!archivo} size="lg">
            Simular
          </Button>
        </div>
        {ocupado && (
          <p className="aviso-discreto" role="status">
            Procesando el archivo, puede tardar unos segundos…
          </p>
        )}
      </form>

      {vistaPrevia && (
        <section className="tarjeta-seccion" aria-label="Vista previa de la importación">
          <Text>
            Simulación sin cambios en el catálogo. Libros por crear:{' '}
            {vistaPrevia.works?.created ?? vistaPrevia.created}; por actualizar:{' '}
            {vistaPrevia.works?.updated ?? vistaPrevia.updated}. Ejemplares por
            crear: {vistaPrevia.copies?.created ?? vistaPrevia.created}; por
            actualizar: {vistaPrevia.copies?.updated ?? vistaPrevia.updated}.
            Filas con errores: {vistaPrevia.failed}.
          </Text>
          {vistaPrevia.failed > 0 && (
            <>
              <ul>
                {acotarErrores(vistaPrevia.rows).visibles.map((fila) =>
                  fila.status === 'failed' ? (
                    <li key={fila.row}>
                      Fila {fila.row}: {fila.field ? `${fila.field}: ` : ''}
                      {fila.error}
                    </li>
                  ) : null,
                )}
              </ul>
              <AvisoErroresOcultos n={acotarErrores(vistaPrevia.rows).ocultas} />
            </>
          )}
          <Group gap="sm">
            <Button
              type="button"
              loading={ocupado}
              style={{ minHeight: 44 }}
              onClick={confirmar}
            >
              Confirmar importación
            </Button>
            <Button
              type="button"
              variant="default"
              style={{ minHeight: 44 }}
              onClick={() => {
                setArchivo(null)
                reiniciar()
              }}
            >
              Elegir otro archivo
            </Button>
            {vistaPrevia.failed > 0 && (
              <Button
                type="button"
                variant="default"
                loading={descargando}
                style={{ minHeight: 44 }}
                onClick={() => descargarErrores(vistaPrevia)}
              >
                Descargar errores (CSV)
              </Button>
            )}
          </Group>
        </section>
      )}

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
                reiniciar()
                setArchivo(null)
                window.scrollTo({ top: 0 })
              }}
            >
              Importar otro archivo
            </Button>
            {reporte.failed > 0 && (
              <Button
                type="button"
                variant="default"
                loading={descargando}
                style={{ minHeight: 44 }}
                onClick={() => descargarErrores(reporte)}
              >
                Descargar errores (CSV)
              </Button>
            )}
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
                {acotarErrores(reporte.rows).visibles.map((fila) => (
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
          <AvisoErroresOcultos n={acotarErrores(reporte.rows).ocultas} />
        </section>
      )}
    </div>
  )
}
