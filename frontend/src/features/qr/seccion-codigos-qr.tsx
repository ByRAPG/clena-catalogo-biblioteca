import { Alert, Button, Loader, Stack, Text } from '@mantine/core'
import { IconoDescargar, IconoQr } from '../../shared/ui/iconos'
import { useCallback, useEffect, useState } from 'react'
import { peticion, urlAbsoluta } from '../../shared/api/client'
import { FranjaFoto } from '../../shared/ui/franja-foto'
import { useSesion } from '../auth/sesion-context'
import {
  guardarArchivo,
  mensajeDeFalloQr,
  nombreDeArchivoQr,
  obtenerQrDeSala,
} from './descargar-qr'

interface Sala {
  id: string
  name: string
}

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; salas: Sala[] }

const ALTO_MINIMO = 44

/**
 * Descarga de los códigos QR para imprimir (HU-05): el de la entrada y uno por
 * sala, que abre el buscador con esa sala filtrada.
 *
 * El QR de entrada es público y se baja con un enlace. El de cada sala exige
 * sesión del personal (HU-09), así que se pide con el token y luego se entrega
 * al navegador como archivo.
 */
export function SeccionCodigosQr() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [intento, setIntento] = useState(0)
  const { sesion } = useSesion()
  const [descargando, setDescargando] = useState<string | null>(null)
  const [falloDeDescarga, setFalloDeDescarga] = useState<{
    salaId: string
    mensaje: string
  } | null>(null)

  async function descargar(sala: Sala) {
    if (descargando !== null) return
    setFalloDeDescarga(null)
    if (sesion === null) {
      setFalloDeDescarga({
        salaId: sala.id,
        mensaje: 'Ingrese con su cuenta para descargar el código.',
      })
      return
    }
    setDescargando(sala.id)
    try {
      const imagen = await obtenerQrDeSala(sala.id, sesion.token)
      guardarArchivo(imagen, nombreDeArchivoQr(sala.name))
    } catch (causa: unknown) {
      setFalloDeDescarga({ salaId: sala.id, mensaje: mensajeDeFalloQr(causa) })
    } finally {
      setDescargando(null)
    }
  }

  const reintentar = useCallback(() => {
    setEstado({ tipo: 'cargando' })
    setIntento((n) => n + 1)
  }, [])

  useEffect(() => {
    const control = new AbortController()
    peticion<{ data: Sala[] }>('/search/rooms', { signal: control.signal })
      .then((respuesta) => setEstado({ tipo: 'listo', salas: respuesta.data }))
      .catch(() => {
        if (control.signal.aborted) return
        setEstado({
          tipo: 'error',
          mensaje:
            'No se pudieron cargar las salas. Revise su conexión e intente de nuevo.',
        })
      })
    return () => control.abort()
  }, [intento])

  return (
    <FranjaFoto
      as="section"
      id="codigos-qr"
      foto="pov"
      tono="ambar"
      className="zona-qr"
      aria-labelledby="titulo-codigos-qr"
    >
      <div className="zona-fila zona-qr-fila">
      <div className="seccion-cabecera">
        <span className="insignia-icono" aria-hidden="true">
          <IconoQr />
        </span>
        <div>
          <h2 id="titulo-codigos-qr" className="seccion-titulo">
            Códigos QR
          </h2>
          <p className="encabezado-descripcion">
            Imprima el código y péguelo en la entrada de la sala. Al escanearlo
            se abre el buscador con esa sala seleccionada.
          </p>
        </div>
      </div>

      <Button
        component="a"
        href={urlAbsoluta('/rooms/qr')}
        download
        mih={ALTO_MINIMO}
        w="fit-content"
        leftSection={<IconoDescargar size={20} />}
      >
        Descargar QR de entrada
      </Button>

      <Button
        component="a"
        href="#tareas-gestion"
        variant="default"
        mih={ALTO_MINIMO}
        w="fit-content"
      >
        ↑ Volver a las tareas de gestión
      </Button>

      {estado.tipo === 'cargando' && (
        <Stack gap="xs" role="status" align="flex-start">
          <Loader size="sm" aria-hidden />
          <Text>Cargando salas…</Text>
        </Stack>
      )}

      {estado.tipo === 'error' && (
        <Alert color="red" title="No se pudo cargar" role="alert">
          <Stack gap="sm" align="flex-start">
            <Text>{estado.mensaje}</Text>
            <Button mih={ALTO_MINIMO} onClick={reintentar}>
              Reintentar
            </Button>
          </Stack>
        </Alert>
      )}

      {estado.tipo === 'listo' && estado.salas.length === 0 && (
        <p className="estado-vacio">Todavía no hay salas registradas.</p>
      )}

      {estado.tipo === 'listo' && estado.salas.length > 0 && (
        <ul className="lista-salas">
          {estado.salas.map((sala) => (
            <li key={sala.id} className="sala-item">
              <Button
                type="button"
                variant="default"
                mih={ALTO_MINIMO}
                loading={descargando === sala.id}
                disabled={descargando !== null && descargando !== sala.id}
                onClick={() => void descargar(sala)}
                leftSection={<IconoQr size={20} />}
              >
                Descargar QR de {sala.name}
              </Button>
              {falloDeDescarga?.salaId === sala.id && (
                <Text role="alert" c="red.9">
                  {falloDeDescarga.mensaje}
                </Text>
              )}
            </li>
          ))}
        </ul>
      )}
      </div>
    </FranjaFoto>
  )
}
