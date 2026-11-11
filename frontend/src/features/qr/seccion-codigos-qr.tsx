import { Alert, Button, Loader, Stack, Text, Title } from '@mantine/core'
import { useCallback, useEffect, useState } from 'react'
import { peticion, urlAbsoluta } from '../../shared/api/client'

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
 */
export function SeccionCodigosQr() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [intento, setIntento] = useState(0)

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
    <Stack gap="md" component="section" aria-labelledby="titulo-codigos-qr">
      <Title order={3} id="titulo-codigos-qr">
        Códigos QR
      </Title>
      <Text>
        Imprima el código y péguelo en la entrada de la sala. Al escanearlo se
        abre el buscador con esa sala seleccionada.
      </Text>

      <Button
        component="a"
        href={urlAbsoluta('/rooms/qr')}
        download
        mih={ALTO_MINIMO}
        w="fit-content"
      >
        Descargar QR de entrada
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
        <Text>Todavía no hay salas registradas.</Text>
      )}

      {estado.tipo === 'listo' && estado.salas.length > 0 && (
        <Stack gap="sm" component="ul" p={0} m={0} style={{ listStyle: 'none' }}>
          {estado.salas.map((sala) => (
            <li key={sala.id}>
              <Button
                component="a"
                href={urlAbsoluta(`/rooms/${sala.id}/qr`)}
                download
                variant="light"
                mih={ALTO_MINIMO}
              >
                Descargar QR de {sala.name}
              </Button>
            </li>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
