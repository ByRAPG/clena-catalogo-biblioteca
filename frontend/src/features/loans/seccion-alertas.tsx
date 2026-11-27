import { useCallback, useEffect, useState, type FormEvent } from 'react'
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
} from '@mantine/core'
import { IconoAlerta, IconoCheck } from '../../shared/ui/iconos'
import { buscarObras } from '../search/busqueda.api'
import {
  correrRevision,
  obtenerAlertas,
  pedirAvisoDisponibilidad,
  type PanelAlertas,
} from './alertas.api'
import type { LectorMostrador } from './prestamos.api'

function fecha(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function mensaje(causa: unknown, porDefecto: string): string {
  return causa instanceof Error && causa.message ? causa.message : porDefecto
}

/**
 * HU-21: alertas del mostrador. Préstamos vencidos (primero) y por vencer en
 * menos de 48 horas, con el estado del correo, y «Avísame cuando esté
 * disponible» a nombre de un lector.
 */
export function SeccionAlertas({
  token,
  lectores,
}: {
  token: string
  lectores: LectorMostrador[]
}) {
  const [panel, setPanel] = useState<PanelAlertas | null>(null)
  const [error, setError] = useState('')
  const [revisando, setRevisando] = useState(false)
  const [resumen, setResumen] = useState('')

  const [lectorId, setLectorId] = useState<string | null>(null)
  const [textoLibro, setTextoLibro] = useState('')
  const [libros, setLibros] = useState<{ id: string; title: string }[]>([])
  const [libroId, setLibroId] = useState<string | null>(null)
  const [pidiendo, setPidiendo] = useState(false)
  const [errorAviso, setErrorAviso] = useState('')
  const [avisoOk, setAvisoOk] = useState('')

  const cargar = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setPanel(await obtenerAlertas(token, signal))
        setError('')
      } catch (causa) {
        if (!signal?.aborted)
          setError(mensaje(causa, 'No se pudieron cargar las alertas'))
      }
    },
    [token],
  )

  useEffect(() => {
    const control = new AbortController()
    void cargar(control.signal)
    return () => control.abort()
  }, [cargar])

  async function revisar() {
    setRevisando(true)
    setResumen('')
    try {
      const r = await correrRevision(token)
      const total = r.reminders.sent + r.availability.sent
      setResumen(
        total === 0
          ? 'Revisión hecha: no había avisos nuevos por enviar.'
          : `Revisión hecha: ${total} ${total === 1 ? 'correo enviado' : 'correos enviados'}.`,
      )
      await cargar()
    } catch (causa) {
      setError(mensaje(causa, 'No se pudo correr la revisión'))
    } finally {
      setRevisando(false)
    }
  }

  async function buscarLibro() {
    const q = textoLibro.trim()
    if (!q) return
    try {
      const r = await buscarObras({ q })
      setLibros(r.data.map((o) => ({ id: o.id, title: o.title })))
      setLibroId(r.data.length === 1 ? r.data[0].id : null)
    } catch (causa) {
      setErrorAviso(mensaje(causa, 'No se pudo buscar el libro'))
    }
  }

  async function pedirAviso(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErrorAviso('')
    setAvisoOk('')
    if (!lectorId || !libroId) {
      setErrorAviso('Elija el lector y el libro.')
      return
    }
    setPidiendo(true)
    try {
      const aviso = await pedirAvisoDisponibilidad(lectorId, libroId, token)
      setAvisoOk(
        `Listo: avisaremos a ${aviso.readerName} cuando «${aviso.workTitle}» esté disponible.`,
      )
      await cargar()
    } catch (causa) {
      setErrorAviso(mensaje(causa, 'No se pudo registrar el aviso'))
    } finally {
      setPidiendo(false)
    }
  }

  const alertas = panel?.loans ?? []

  return (
    <Paper withBorder p="lg" radius="md" component="section" aria-labelledby="titulo-alertas">
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap">
          <Title order={2} size="h3" id="titulo-alertas">
            Alertas de devolución
          </Title>
          <Button variant="light" loading={revisando} onClick={() => void revisar()}>
            Revisar y enviar avisos ahora
          </Button>
        </Group>
        <Text size="sm">
          La revisión corre sola cada día y no envía el mismo aviso dos veces.
        </Text>

        {resumen && (
          <Alert color="green" variant="light" icon={<IconoCheck size={20} />} role="status">
            {resumen}
          </Alert>
        )}
        {error && (
          <Alert color="red" variant="light" icon={<IconoAlerta size={20} />} role="alert">
            {error}
          </Alert>
        )}

        {panel && alertas.length === 0 && (
          <Text>No hay préstamos vencidos ni por vencer en las próximas 48 horas.</Text>
        )}
        {alertas.length > 0 && (
          <Table.ScrollContainer minWidth={560}>
            <Table striped aria-label="Préstamos vencidos y por vencer">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Libro y ejemplar</Table.Th>
                  <Table.Th>Lector</Table.Th>
                  <Table.Th>Vence</Table.Th>
                  <Table.Th>Correo</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {alertas.map((a) => (
                  <Table.Tr key={`${a.loanId}-${a.type}`}>
                    <Table.Td>
                      <Badge color={a.type === 'VENCIDO' ? 'red' : 'orange'} variant="light">
                        {a.type === 'VENCIDO' ? 'Vencido' : 'Por vencer'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600}>{a.workTitle}</Text>
                      <Text size="sm">{a.inventoryCode}</Text>
                    </Table.Td>
                    <Table.Td>{a.readerName}</Table.Td>
                    <Table.Td>{fecha(a.dueAt)}</Table.Td>
                    <Table.Td>
                      {a.notifiedAt
                        ? `Enviado el ${fecha(a.notifiedAt)}`
                        : (a.notifyError ?? 'Pendiente')}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}

        <Title order={3} size="h4">
          Avísame cuando esté disponible
        </Title>
        <Text size="sm">
          El lector recibe un correo cuando se devuelve un ejemplar del libro.
          Necesita tener correo registrado.
        </Text>
        {avisoOk && (
          <Alert color="green" variant="light" icon={<IconoCheck size={20} />} role="status">
            {avisoOk}
          </Alert>
        )}
        {errorAviso && (
          <Alert color="red" variant="light" icon={<IconoAlerta size={20} />} role="alert">
            {errorAviso}
          </Alert>
        )}
        <form onSubmit={pedirAviso} noValidate>
          <Stack gap="sm">
            <Select
              label="Lector que espera el libro"
              placeholder="Lector que quiere el aviso"
              data={lectores.map((l) => ({
                value: l.id,
                label: l.email ? `${l.fullName} · ${l.email}` : `${l.fullName} (sin correo)`,
              }))}
              value={lectorId}
              onChange={setLectorId}
              searchable
              clearable
              nothingFoundMessage="No se encontraron lectores"
            />
            <Group align="flex-end" gap="sm" wrap="wrap">
              <TextInput
                style={{ flex: 1, minWidth: 220 }}
                label="Buscar el libro por título"
                value={textoLibro}
                onChange={(e) => setTextoLibro(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void buscarLibro()
                  }
                }}
              />
              <Button type="button" variant="light" onClick={() => void buscarLibro()}>
                Buscar libro
              </Button>
            </Group>
            <Select
              label="Libro esperado"
              placeholder={libros.length ? 'Elija el libro' : 'Primero busque el libro'}
              data={libros.map((l) => ({ value: l.id, label: l.title }))}
              value={libroId}
              onChange={setLibroId}
            />
            {panel && panel.availability.length > 0 && (
              <Text size="sm">
                Avisos pendientes:{' '}
                {panel.availability
                  .map((a) => `${a.readerName} espera «${a.workTitle}»`)
                  .join('; ')}
                .
              </Text>
            )}
            <Group>
              <Button type="submit" loading={pidiendo}>
                Registrar aviso
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Paper>
  )
}
