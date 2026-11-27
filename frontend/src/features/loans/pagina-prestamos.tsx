import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Alert,
  Badge,
  Button,
  Group,
  NumberInput,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { EncabezadoSeccion } from '../../shared/ui/encabezado-seccion'
import { IconoAlerta, IconoCheck } from '../../shared/ui/iconos'
import { useSesion } from '../auth/sesion-context'
import {
  buscarEjemplares,
  buscarLectores,
  devolverPrestamo,
  listarPrestamos,
  registrarLector,
  registrarPrestamo,
  type EjemplarParaPrestamo,
  type EstadoFiltroPrestamo,
  type LectorMostrador,
  type Prestamo,
} from './prestamos.api'
import { SeccionAlertas } from './seccion-alertas'

const PLAZO_POR_DEFECTO = 15

const TEXTO_ESTADO_EJEMPLAR: Record<EjemplarParaPrestamo['status'], string> = {
  DISPONIBLE: 'Disponible',
  PRESTADO: 'Prestado',
  MANTENIMIENTO: 'En mantenimiento',
  BAJA: 'Dado de baja',
}

function formatearFecha(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function calcularFechaLimite(dias: number): string {
  const hoy = new Date()
  const limite = new Date(hoy.getTime() + dias * 24 * 60 * 60 * 1000)
  return formatearFecha(limite.toISOString())
}

/** HU-20: el personal registra préstamos y devoluciones de ejemplares. */
export function PaginaPrestamos() {
  const { sesion } = useSesion()
  const token = sesion?.token

  // Datos de selects
  const [ejemplares, setEjemplares] = useState<EjemplarParaPrestamo[]>([])
  const [lectores, setLectores] = useState<LectorMostrador[]>([])

  // Formulario de préstamo
  const [copyId, setCopyId] = useState<string | null>(null)
  const [codigoManual, setCodigoManual] = useState('')
  const [readerId, setReaderId] = useState<string | null>(null)
  // Lo elegido se conserva aparte: al cambiar la búsqueda la lista se
  // reemplaza y la opción elegida no debe desaparecer del campo.
  const [ejemplarElegido, setEjemplarElegido] =
    useState<EjemplarParaPrestamo | null>(null)
  const [lectorElegido, setLectorElegido] = useState<LectorMostrador | null>(
    null,
  )
  const [textoEjemplar, setTextoEjemplar] = useState('')
  const [textoLector, setTextoLector] = useState('')
  const [busquedaEjemplar] = useDebouncedValue(textoEjemplar.trim(), 300)
  const [busquedaLector] = useDebouncedValue(textoLector.trim(), 300)
  const [plazoDias, setPlazoDias] = useState<number | ''>(PLAZO_POR_DEFECTO)
  const [registrando, setRegistrando] = useState(false)
  const [mensajeOk, setMensajeOk] = useState('')
  const [errorPrestamo, setErrorPrestamo] = useState('')

  // Alta rápida de lector de mostrador
  const [mostrarNuevoLector, setMostrarNuevoLector] = useState(false)
  const [nuevoLectorNombre, setNuevoLectorNombre] = useState('')
  const [nuevoLectorDocumento, setNuevoLectorDocumento] = useState('')
  const [nuevoLectorCorreo, setNuevoLectorCorreo] = useState('')
  const [nuevoLectorTelefono, setNuevoLectorTelefono] = useState('')
  const [creandoLector, setCreandoLector] = useState(false)
  const [errorLector, setErrorLector] = useState('')

  // Listado de préstamos
  const [filtroEstado, setFiltroEstado] =
    useState<EstadoFiltroPrestamo>('active')
  const [busqueda, setBusqueda] = useState('')
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [total, setTotal] = useState(0)
  const [errorLista, setErrorLista] = useState('')
  const [devolviendoId, setDevolviendoId] = useState<string | null>(null)
  const [refresco, setRefresco] = useState(0)
  // La lista está cargando mientras la última carga terminada no sea la de los
  // filtros actuales; así vuelve a «cargando» en cada petición nueva.
  const claveLista = `${filtroEstado}|${busqueda.trim()}|${refresco}`
  const [listaCargada, setListaCargada] = useState<string | null>(null)
  const cargandoLista = listaCargada !== claveLista

  const recargarTodo = useCallback(() => {
    setRefresco((n) => n + 1)
  }, [])

  // Las sugerencias se piden al backend con lo que la persona escribe, para
  // que un ejemplar o lector fuera de los primeros 30 también se pueda elegir.
  useEffect(() => {
    if (!token) return
    const control = new AbortController()
    buscarEjemplares(busquedaEjemplar, token, control.signal)
      .then(setEjemplares)
      .catch(() => {
        // Si fallan las sugerencias, igual se puede ingresar código manual.
      })
    return () => control.abort()
  }, [token, refresco, busquedaEjemplar])

  useEffect(() => {
    if (!token) return
    const control = new AbortController()
    buscarLectores(busquedaLector, token, control.signal)
      .then(setLectores)
      .catch(() => {
        // Sin sugerencias se puede registrar un lector nuevo.
      })
    return () => control.abort()
  }, [token, refresco, busquedaLector])

  useEffect(() => {
    if (!token) return
    const control = new AbortController()
    let cancelado = false
    listarPrestamos(
      { status: filtroEstado, q: busqueda.trim() || undefined, pageSize: 50 },
      token,
      control.signal,
    )
      .then((res) => {
        if (cancelado) return
        setPrestamos(res.data)
        setTotal(res.total)
        setErrorLista('')
      })
      .catch((causa: unknown) => {
        if (
          cancelado ||
          (causa instanceof DOMException && causa.name === 'AbortError')
        ) {
          return
        }
        setErrorLista(
          causa instanceof Error
            ? causa.message
            : 'No se pudieron cargar los préstamos',
        )
      })
      .finally(() => {
        if (!cancelado) setListaCargada(claveLista)
      })
    return () => {
      cancelado = true
      control.abort()
    }
  }, [token, filtroEstado, busqueda, refresco, claveLista])

  const opcionesEjemplares = useMemo(
    () =>
      (ejemplarElegido && !ejemplares.some((e) => e.id === ejemplarElegido.id)
        ? [ejemplarElegido, ...ejemplares]
        : ejemplares
      ).map((ej) => ({
        value: ej.id,
        label:
          ej.status === 'DISPONIBLE'
            ? `${ej.inventoryCode} · ${ej.workTitle}`
            : `${ej.inventoryCode} · ${ej.workTitle} (${TEXTO_ESTADO_EJEMPLAR[ej.status]})`,
        disabled: ej.status !== 'DISPONIBLE',
      })),
    [ejemplares, ejemplarElegido],
  )

  const opcionesLectores = useMemo(
    () =>
      (lectorElegido && !lectores.some((l) => l.id === lectorElegido.id)
        ? [lectorElegido, ...lectores]
        : lectores
      ).map((lec) => ({
        value: lec.id,
        label: lec.documentId
          ? `${lec.fullName} · Doc. ${lec.documentId}`
          : lec.email
            ? `${lec.fullName} · ${lec.email}`
            : lec.fullName,
      })),
    [lectores, lectorElegido],
  )

  async function guardarPrestamo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!token || registrando) return
    setErrorPrestamo('')
    setMensajeOk('')

    const codigo = codigoManual.trim()
    if (!copyId && !codigo) {
      setErrorPrestamo('Seleccione un ejemplar o escriba su código de inventario')
      return
    }
    if (plazoDias === '' || plazoDias < 1 || plazoDias > 60) {
      setErrorPrestamo('Escriba un plazo entre 1 y 60 días')
      return
    }
    if (!readerId) {
      setErrorPrestamo('Seleccione un lector para registrar el préstamo')
      return
    }

    setRegistrando(true)
    try {
      const creado = await registrarPrestamo(
        {
          copyId: copyId ?? undefined,
          inventoryCode: copyId ? undefined : codigo,
          readerId,
          loanDays: plazoDias,
        },
        token,
      )
      setMensajeOk(
        `Préstamo registrado: ${creado.copy.inventoryCode} («${creado.copy.workTitle}») para ${creado.reader.fullName}. Fecha límite: ${formatearFecha(creado.dueAt)}.`,
      )
      setCopyId(null)
      setCodigoManual('')
      recargarTodo()
    } catch (causa: unknown) {
      setErrorPrestamo(
        causa instanceof Error
          ? causa.message
          : 'No se pudo registrar el préstamo',
      )
    } finally {
      setRegistrando(false)
    }
  }

  async function guardarLectorNuevo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!token || creandoLector) return
    setErrorLector('')

    if (nuevoLectorNombre.trim().length < 2) {
      setErrorLector('Escriba el nombre completo del lector')
      return
    }

    setCreandoLector(true)
    try {
      const creado = await registrarLector(
        {
          fullName: nuevoLectorNombre.trim(),
          documentId: nuevoLectorDocumento.trim() || undefined,
          email: nuevoLectorCorreo.trim() || undefined,
          phone: nuevoLectorTelefono.trim() || undefined,
        },
        token,
      )
      setLectores((prev) => [creado, ...prev])
      setReaderId(creado.id)
      setLectorElegido(creado)
      setNuevoLectorNombre('')
      setNuevoLectorDocumento('')
      setNuevoLectorCorreo('')
      setNuevoLectorTelefono('')
      setMostrarNuevoLector(false)
    } catch (causa: unknown) {
      setErrorLector(
        causa instanceof Error ? causa.message : 'No se pudo crear el lector',
      )
    } finally {
      setCreandoLector(false)
    }
  }

  async function marcarDevuelto(loanId: string) {
    if (!token || devolviendoId) return
    setDevolviendoId(loanId)
    setErrorPrestamo('')
    setMensajeOk('')
    try {
      const devuelto = await devolverPrestamo(loanId, token)
      setMensajeOk(
        `Devolución registrada: ${devuelto.copy.inventoryCode} («${devuelto.copy.workTitle}») vuelve a estar disponible.`,
      )
      recargarTodo()
    } catch (causa: unknown) {
      setErrorPrestamo(
        causa instanceof Error
          ? causa.message
          : 'No se pudo registrar la devolución',
      )
    } finally {
      setDevolviendoId(null)
    }
  }

  return (
    <div className="pantalla-gestion">
      <EncabezadoSeccion
        migas={[
          { texto: 'Inicio', to: '/' },
          { texto: 'Gestión', to: '/gestion' },
          { texto: 'Préstamos y devoluciones' },
        ]}
        volver={{ texto: 'Volver a gestión', to: '/gestion' }}
        rotulo="Circulación"
        titulo="Préstamos y devoluciones"
        descripcion="Registre préstamos de ejemplares disponibles y marque devoluciones en el mostrador."
      />

      <Stack gap="lg">
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

        {errorPrestamo && (
          <Alert
            color="red"
            variant="light"
            icon={<IconoAlerta size={20} />}
            role="alert"
          >
            {errorPrestamo}
          </Alert>
        )}

        {token && <SeccionAlertas token={token} lectores={lectores} />}

        <Paper withBorder p="lg" radius="md">
          <Stack gap="md">
            <Title order={2} size="h3">
              Registrar nuevo préstamo
            </Title>

            <form onSubmit={guardarPrestamo} noValidate>
              <Stack gap="md">
                <Select
                  label="Ejemplar del catálogo"
                  placeholder="Busque por código de inventario o título"
                  data={opcionesEjemplares}
                  value={copyId}
                  onChange={(valor) => {
                    setCopyId(valor)
                    setEjemplarElegido(
                      ejemplares.find((e) => e.id === valor) ?? null,
                    )
                    if (valor) setCodigoManual('')
                  }}
                  searchable
                  clearable
                  filter={({ options }) => options}
                  onSearchChange={setTextoEjemplar}
                  nothingFoundMessage="No se encontraron ejemplares"
                />

                <TextInput
                  label="O ingrese el código de inventario"
                  placeholder="Ej. CLENA-0001-1"
                  value={codigoManual}
                  onChange={(e) => {
                    setCodigoManual(e.currentTarget.value)
                    if (e.currentTarget.value.trim()) setCopyId(null)
                  }}
                />

                <Group align="flex-end" gap="sm" wrap="wrap">
                  <Select
                    style={{ flex: 1, minWidth: 240 }}
                    label="Lector"
                    placeholder="Seleccione un lector"
                    data={opcionesLectores}
                    value={readerId}
                    onChange={(valor) => {
                      setReaderId(valor)
                      setLectorElegido(
                        lectores.find((l) => l.id === valor) ?? null,
                      )
                    }}
                    searchable
                    clearable
                    filter={({ options }) => options}
                    onSearchChange={setTextoLector}
                    nothingFoundMessage="No se encontraron lectores"
                  />
                  <Button
                    type="button"
                    variant="light"
                    onClick={() => setMostrarNuevoLector((v) => !v)}
                  >
                    {mostrarNuevoLector ? 'Cancelar nuevo lector' : 'Nuevo lector'}
                  </Button>
                </Group>

                <Group align="flex-end" gap="md" wrap="wrap">
                  <NumberInput
                    label="Plazo (días)"
                    min={1}
                    max={60}
                    value={plazoDias}
                    onChange={(valor) =>
                      setPlazoDias(typeof valor === 'number' ? valor : '')
                    }
                    w={160}
                  />
                  <Text size="sm" c="dimmed" pb={8}>
                    Fecha límite estimada:{' '}
                    <strong>
                      {plazoDias === ''
                        ? 'indique el plazo'
                        : calcularFechaLimite(plazoDias)}
                    </strong>
                  </Text>
                </Group>

                <Group>
                  <Button type="submit" loading={registrando}>
                    Registrar préstamo
                  </Button>
                </Group>
              </Stack>
            </form>

            {mostrarNuevoLector && (
              <Paper withBorder p="md" radius="sm" bg="gray.0">
                <form onSubmit={guardarLectorNuevo} noValidate>
                  <Stack gap="sm">
                    <Title order={3} size="h4">
                      Registrar lector en mostrador
                    </Title>
                    {errorLector && (
                      <Alert color="red" variant="light" role="alert">
                        {errorLector}
                      </Alert>
                    )}
                    <TextInput
                      label="Nombre completo"
                      required
                      value={nuevoLectorNombre}
                      onChange={(e) =>
                        setNuevoLectorNombre(e.currentTarget.value)
                      }
                    />
                    <Group grow wrap="wrap">
                      <TextInput
                        label="Documento (opcional)"
                        value={nuevoLectorDocumento}
                        onChange={(e) =>
                          setNuevoLectorDocumento(e.currentTarget.value)
                        }
                      />
                      <TextInput
                        label="Correo (opcional)"
                        type="email"
                        value={nuevoLectorCorreo}
                        onChange={(e) =>
                          setNuevoLectorCorreo(e.currentTarget.value)
                        }
                      />
                      <TextInput
                        label="Teléfono (opcional)"
                        value={nuevoLectorTelefono}
                        onChange={(e) =>
                          setNuevoLectorTelefono(e.currentTarget.value)
                        }
                      />
                    </Group>
                    <Group>
                      <Button
                        type="submit"
                        size="sm"
                        loading={creandoLector}
                      >
                        Guardar y seleccionar lector
                      </Button>
                    </Group>
                  </Stack>
                </form>
              </Paper>
            )}
          </Stack>
        </Paper>

        <Paper withBorder p="lg" radius="md">
          <Stack gap="md">
            <Group justify="space-between" align="center" wrap="wrap">
              <Title order={2} size="h3">
                Préstamos ({total})
              </Title>
              <SegmentedControl
                aria-label="Filtrar préstamos por estado"
                value={filtroEstado}
                onChange={(v) => setFiltroEstado(v as EstadoFiltroPrestamo)}
                data={[
                  { label: 'Activos', value: 'active' },
                  { label: 'Devueltos', value: 'returned' },
                  { label: 'Todos', value: 'all' },
                ]}
              />
            </Group>

            <TextInput
              label="Buscar en préstamos"
              placeholder="Código de inventario, título del libro o nombre del lector"
              value={busqueda}
              onChange={(e) => setBusqueda(e.currentTarget.value)}
            />

            {errorLista && (
              <Alert color="red" variant="light" role="alert">
                {errorLista}
              </Alert>
            )}

            {cargandoLista ? (
              <Text c="dimmed">Cargando préstamos…</Text>
            ) : prestamos.length === 0 ? (
              <Text c="dimmed">No hay préstamos para mostrar con este filtro.</Text>
            ) : (
              <Table.ScrollContainer minWidth={720}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Ejemplar y obra</Table.Th>
                      <Table.Th>Lector</Table.Th>
                      <Table.Th>Prestado</Table.Th>
                      <Table.Th>Fecha límite</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th>Acción</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {prestamos.map((item) => (
                      <Table.Tr key={item.id}>
                        <Table.Td>
                          <Text fw={600} size="sm">
                            {item.copy.workTitle}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {item.copy.inventoryCode} · {item.copy.room} ·{' '}
                            {item.copy.section} · Estante {item.copy.shelf}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{item.reader.fullName}</Text>
                          {item.reader.documentId && (
                            <Text size="xs" c="dimmed">
                              Doc. {item.reader.documentId}
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td>{formatearFecha(item.loanedAt)}</Table.Td>
                        <Table.Td>{formatearFecha(item.dueAt)}</Table.Td>
                        <Table.Td>
                          {!item.active ? (
                            <Badge color="gray" variant="light">
                              Devuelto{' '}
                              {item.returnedAt
                                ? formatearFecha(item.returnedAt)
                                : ''}
                            </Badge>
                          ) : item.overdue ? (
                            <Badge color="red" variant="light">
                              Vencido
                            </Badge>
                          ) : (
                            <Badge color="orange" variant="light">
                              Prestado
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          {item.active ? (
                            <Button
                              size="xs"
                              variant="light"
                              color="green"
                              loading={devolviendoId === item.id}
                              onClick={() => void marcarDevuelto(item.id)}
                            >
                              Registrar devolución
                            </Button>
                          ) : (
                            <Text size="xs" c="dimmed">
                              Completado
                            </Text>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Stack>
        </Paper>
      </Stack>
    </div>
  )
}
