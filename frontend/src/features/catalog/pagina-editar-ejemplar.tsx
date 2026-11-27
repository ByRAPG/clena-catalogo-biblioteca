import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  VisuallyHidden,
} from '@mantine/core'
import { EncabezadoSeccion } from '../../shared/ui/encabezado-seccion'
import { IconoAlerta, IconoCheck } from '../../shared/ui/iconos'
import { useSesion } from '../auth/sesion-context'
import {
  buscarEjemplares,
  type EjemplarParaPrestamo,
} from '../loans/prestamos.api'
import {
  actualizarEjemplar,
  listarEstantes,
  rotuloEstante,
  type CambiosEjemplar,
  type EstadoEditable,
  type EstadoEjemplar,
  type Estante,
} from './ejemplares.api'
import { SeccionNuevoEjemplar } from './seccion-nuevo-ejemplar'

const TEXTO_ESTADO: Record<EstadoEjemplar, string> = {
  DISPONIBLE: 'Disponible',
  PRESTADO: 'Prestado',
  MANTENIMIENTO: 'En mantenimiento',
  BAJA: 'Dado de baja',
}

const OPCIONES_ESTADO: { value: EstadoEditable; label: string }[] = [
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'BAJA', label: 'Dado de baja' },
]

function mensajeDe(causa: unknown, porDefecto: string): string {
  return causa instanceof Error && causa.message ? causa.message : porDefecto
}

/**
 * Ejemplares del catálogo: registrar uno nuevo (HU-19) y cambiar el estante o
 * el estado de uno existente (HU-11).
 */
export function PaginaEditarEjemplar() {
  const { sesion } = useSesion()
  const token = sesion?.token

  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState<EjemplarParaPrestamo[] | null>(
    null,
  )
  const [buscando, setBuscando] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState('')

  const [estantes, setEstantes] = useState<Estante[]>([])
  const [seleccionado, setSeleccionado] = useState<EjemplarParaPrestamo | null>(
    null,
  )
  const [estanteId, setEstanteId] = useState<string | null>(null)
  const [estado, setEstado] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')
  const [mensajeOk, setMensajeOk] = useState('')
  const [errorEstantes, setErrorEstantes] = useState(false)
  const [intentoEstantes, setIntentoEstantes] = useState(0)

  useEffect(() => {
    if (!token) return
    const control = new AbortController()
    listarEstantes(token, control.signal)
      .then((lista) => {
        setEstantes(lista)
        setErrorEstantes(false)
      })
      .catch((causa: unknown) => {
        if (control.signal.aborted) return
        if (causa instanceof DOMException && causa.name === 'AbortError') return
        setErrorEstantes(true)
      })
    return () => control.abort()
  }, [token, intentoEstantes])

  const opcionesEstantes = useMemo(
    () => estantes.map((e) => ({ value: e.id, label: rotuloEstante(e) })),
    [estantes],
  )

  /** El buscador de préstamos no trae el id del estante: se ubica por nombre. */
  function estanteActual(ejemplar: EjemplarParaPrestamo): string | null {
    const actual = estantes.find(
      (e) =>
        e.room === ejemplar.room &&
        e.section === ejemplar.section &&
        e.code === ejemplar.shelf,
    )
    return actual?.id ?? null
  }

  async function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!token || buscando) return
    setErrorBusqueda('')
    setBuscando(true)
    try {
      setResultados(await buscarEjemplares(texto.trim(), token))
    } catch (causa) {
      setErrorBusqueda(mensajeDe(causa, 'No se pudo buscar ejemplares'))
    } finally {
      setBuscando(false)
    }
  }

  function elegir(ejemplar: EjemplarParaPrestamo) {
    setSeleccionado(ejemplar)
    setEstanteId(estanteActual(ejemplar))
    setEstado(ejemplar.status === 'PRESTADO' ? null : ejemplar.status)
    setErrorGuardar('')
    setMensajeOk('')
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!token || !seleccionado || guardando) return
    setErrorGuardar('')
    setMensajeOk('')

    const cambios: CambiosEjemplar = {}
    if (estanteId && estanteId !== estanteActual(seleccionado)) {
      cambios.shelfId = estanteId
    }
    if (estado && estado !== seleccionado.status) {
      cambios.status = estado as EstadoEditable
    }
    if (!cambios.shelfId && !cambios.status) {
      setErrorGuardar('Cambie el estante o el estado antes de guardar.')
      return
    }

    setGuardando(true)
    try {
      const nuevo = await actualizarEjemplar(seleccionado.id, cambios, token)
      const actualizado: EjemplarParaPrestamo = {
        ...seleccionado,
        status: nuevo.status,
        room: nuevo.room,
        section: nuevo.section,
        shelf: nuevo.shelf,
      }
      setSeleccionado(actualizado)
      setResultados(
        (lista) =>
          lista?.map((e) => (e.id === actualizado.id ? actualizado : e)) ??
          null,
      )
      setMensajeOk(
        `Ejemplar ${nuevo.inventoryCode} actualizado: ${rotuloEstante(nuevo)} · ${TEXTO_ESTADO[nuevo.status]}.`,
      )
    } catch (causa) {
      setErrorGuardar(mensajeDe(causa, 'No se pudo guardar el ejemplar'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="pantalla-gestion">
      <EncabezadoSeccion
        migas={[
          { texto: 'Inicio', to: '/' },
          { texto: 'Gestión', to: '/gestion' },
          { texto: 'Ejemplares' },
        ]}
        volver={{ texto: 'Volver a gestión', to: '/gestion' }}
        rotulo="Catálogo"
        titulo="Ejemplares"
        descripcion="Registre las copias físicas de un libro o cambie el estante y el estado de una. La búsqueda pública se actualiza de inmediato."
      />

      <Stack gap="lg">
        {errorEstantes && (
          <Alert
            color="red"
            variant="light"
            icon={<IconoAlerta size={20} />}
            role="alert"
            title="No se pudieron cargar los estantes"
          >
            <Group justify="space-between" align="center" wrap="wrap">
              <Text size="sm">
                Sin la lista de estantes no se puede registrar ni mover un
                ejemplar.
              </Text>
              <Button
                size="xs"
                variant="light"
                color="red"
                onClick={() => setIntentoEstantes((n) => n + 1)}
              >
                Intentar de nuevo
              </Button>
            </Group>
          </Alert>
        )}

        <SeccionNuevoEjemplar estantes={estantes} token={token} />

        {mensajeOk && (
          <Alert
            color="green"
            variant="light"
            icon={<IconoCheck size={20} />}
            role="status"
          >
            {mensajeOk}
          </Alert>
        )}

        <Paper withBorder p="lg" radius="md">
          <form onSubmit={buscar} noValidate>
            <Stack gap="md">
              <Title order={2} size="h3">
                1. Buscar el ejemplar
              </Title>
              <Group align="flex-end" gap="sm" wrap="wrap">
                <TextInput
                  style={{ flex: 1, minWidth: 240 }}
                  label="Código de inventario o título"
                  placeholder="Ej. CLENA-0001-1"
                  value={texto}
                  onChange={(e) => setTexto(e.currentTarget.value)}
                />
                <Button type="submit" loading={buscando}>
                  Buscar
                </Button>
              </Group>
              <Text size="sm" c="dimmed">
                Los ejemplares dados de baja no aparecen en esta búsqueda.
              </Text>
              {errorBusqueda && (
                <Alert color="red" variant="light" role="alert">
                  {errorBusqueda}
                </Alert>
              )}
              {resultados !== null && resultados.length === 0 && (
                <Text>No se encontraron ejemplares con ese código o título.</Text>
              )}
              {resultados !== null && resultados.length > 0 && (
                <Table.ScrollContainer minWidth={520}>
                  <Table striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Ejemplar</Table.Th>
                        <Table.Th>Ubicación</Table.Th>
                        <Table.Th>Estado</Table.Th>
                        <Table.Th>
                          <VisuallyHidden>Acción</VisuallyHidden>
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {resultados.map((e) => (
                        <Table.Tr key={e.id}>
                          <Table.Td>
                            <Text fw={600}>{e.inventoryCode}</Text>
                            <Text size="sm">{e.workTitle}</Text>
                          </Table.Td>
                          <Table.Td>{rotuloEstante(e)}</Table.Td>
                          <Table.Td>
                            <Badge variant="light">
                              {TEXTO_ESTADO[e.status]}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Button
                              variant="light"
                              onClick={() => elegir(e)}
                              aria-label={`Editar ${e.inventoryCode}`}
                            >
                              Editar
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              )}
            </Stack>
          </form>
        </Paper>

        {seleccionado && (
          <Paper withBorder p="lg" radius="md">
            <form onSubmit={guardar} noValidate>
              <Stack gap="md">
                <Title order={2} size="h3">
                  2. Editar {seleccionado.inventoryCode}
                </Title>
                <Text>
                  {seleccionado.workTitle}. Ahora en{' '}
                  <strong>{rotuloEstante(seleccionado)}</strong>, estado{' '}
                  <strong>{TEXTO_ESTADO[seleccionado.status]}</strong>.
                </Text>
                {seleccionado.status === 'PRESTADO' && (
                  <Text size="sm">
                    Si el ejemplar tiene un préstamo activo, el estado cambia al
                    registrar la devolución. El estante sí se puede cambiar.
                  </Text>
                )}
                {errorGuardar && (
                  <Alert
                    color="red"
                    variant="light"
                    icon={<IconoAlerta size={20} />}
                    role="alert"
                  >
                    {errorGuardar}
                  </Alert>
                )}
                <Select
                  label="Estante"
                  placeholder="Elija sala, sección y estante"
                  data={opcionesEstantes}
                  value={estanteId}
                  onChange={setEstanteId}
                  searchable
                  nothingFoundMessage="No hay estantes con ese nombre"
                  disabled={guardando}
                />
                <Select
                  label="Estado"
                  placeholder="Elija el estado"
                  data={OPCIONES_ESTADO}
                  value={estado}
                  onChange={setEstado}
                  allowDeselect={false}
                  disabled={guardando}
                />
                {estado === 'BAJA' && seleccionado.status !== 'BAJA' && (
                  <Alert color="yellow" variant="light" role="note">
                    Un ejemplar dado de baja deja de aparecer en esta búsqueda y
                    en los préstamos. Confirme que es lo que desea antes de
                    guardar.
                  </Alert>
                )}
                <Group>
                  <Button type="submit" loading={guardando}>
                    Guardar cambios
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        )}
      </Stack>
    </div>
  )
}
