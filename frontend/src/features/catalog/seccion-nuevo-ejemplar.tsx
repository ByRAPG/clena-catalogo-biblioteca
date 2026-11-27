import { useState, type FormEvent } from 'react'
import {
  Alert,
  Anchor,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { Link, useSearchParams } from 'react-router-dom'
import { IconoAlerta, IconoCheck } from '../../shared/ui/iconos'
import { buscarObras } from '../search/busqueda.api'
import {
  registrarEjemplar,
  rotuloEstante,
  type EjemplarActualizado,
  type EstadoEditable,
  type Estante,
} from './ejemplares.api'

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Obra {
  id: string
  title: string
}

interface Errores {
  obra?: string
  codigo?: string
  estante?: string
}

const OPCIONES_ESTADO: { value: EstadoEditable; label: string }[] = [
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'MANTENIMIENTO', label: 'En mantenimiento' },
  { value: 'BAJA', label: 'Dado de baja' },
]

/**
 * HU-19: registrar un ejemplar de un libro con su código de inventario y su
 * estante. Si se llega desde «Libro registrado», el libro viene elegido
 * (`?obra=<id>&titulo=<título>`).
 */
export function SeccionNuevoEjemplar({
  estantes,
  token,
}: {
  estantes: Estante[]
  token: string | undefined
}) {
  const [parametros] = useSearchParams()
  const obraParametro = parametros.get('obra')
  const obraInicial: Obra | null =
    obraParametro && UUID.test(obraParametro)
      ? { id: obraParametro, title: parametros.get('titulo') ?? 'Libro elegido' }
      : null

  const [textoObra, setTextoObra] = useState('')
  const [obras, setObras] = useState<Obra[]>(obraInicial ? [obraInicial] : [])
  const [obraId, setObraId] = useState<string | null>(obraInicial?.id ?? null)
  const [buscandoObras, setBuscandoObras] = useState(false)
  const [sinResultados, setSinResultados] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [estanteId, setEstanteId] = useState<string | null>(null)
  const [estado, setEstado] = useState<string | null>('DISPONIBLE')
  const [errores, setErrores] = useState<Errores>({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [registrado, setRegistrado] = useState<{
    ejemplar: EjemplarActualizado
    obra: Obra
  } | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function buscarLibro() {
    const q = textoObra.trim()
    if (!q || buscandoObras) return
    setBuscandoObras(true)
    setErrorGeneral('')
    setSinResultados(false)
    try {
      const respuesta = await buscarObras({ q })
      setSinResultados(respuesta.data.length === 0)
      setObras(respuesta.data.map((o) => ({ id: o.id, title: o.title })))
      setObraId(respuesta.data.length === 1 ? respuesta.data[0].id : null)
    } catch (causa) {
      setErrorGeneral(
        causa instanceof Error ? causa.message : 'No se pudo buscar el libro',
      )
    } finally {
      setBuscandoObras(false)
    }
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!token || guardando) return
    setErrorGeneral('')
    setRegistrado(null)
    const nuevos: Errores = {}
    if (!obraId) nuevos.obra = 'Busque y elija el libro'
    if (!codigo.trim()) nuevos.codigo = 'Escriba el código de inventario'
    else if (/\s/.test(codigo.trim()))
      nuevos.codigo = 'El código no puede tener espacios'
    if (!estanteId) nuevos.estante = 'Elija sala, sección y estante'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0 || !obraId || !estanteId) return

    setGuardando(true)
    try {
      const ejemplar = await registrarEjemplar(
        obraId,
        {
          inventoryCode: codigo.trim(),
          shelfId: estanteId,
          status: (estado ?? 'DISPONIBLE') as EstadoEditable,
        },
        token,
      )
      const obra = obras.find((o) => o.id === obraId) ?? {
        id: obraId,
        title: 'el libro',
      }
      setRegistrado({ ejemplar, obra })
      // Listo para el siguiente ejemplar del mismo libro y estante.
      setCodigo('')
    } catch (causa) {
      setErrorGeneral(
        causa instanceof Error ? causa.message : 'No se pudo registrar el ejemplar',
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Paper withBorder p="lg" radius="md">
      <form onSubmit={guardar} noValidate>
        <Stack gap="md">
          <Title order={2} size="h3">
            Registrar un ejemplar nuevo
          </Title>
          <Text size="sm">
            Cada copia física lleva su propio código de inventario y su
            ubicación.
          </Text>

          {registrado && (
            <Alert
              color="green"
              variant="light"
              icon={<IconoCheck size={20} />}
              role="status"
              title="Ejemplar registrado"
            >
              <Stack gap="xs">
                <Text>
                  {registrado.ejemplar.inventoryCode} de «{registrado.obra.title}»
                  quedó en {rotuloEstante(registrado.ejemplar)}.
                </Text>
                <Anchor component={Link} to={`/obras/${registrado.obra.id}`}>
                  Ver la ficha del libro
                </Anchor>
              </Stack>
            </Alert>
          )}
          {errorGeneral && (
            <Alert
              color="red"
              variant="light"
              icon={<IconoAlerta size={20} />}
              role="alert"
            >
              {errorGeneral}
            </Alert>
          )}

          <Group align="flex-end" gap="sm" wrap="wrap">
            <TextInput
              style={{ flex: 1, minWidth: 220 }}
              label="Buscar el libro por título"
              value={textoObra}
              onChange={(e) => setTextoObra(e.currentTarget.value)}
              onKeyDown={(e) => {
                // Enter busca el libro en vez de enviar el formulario.
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void buscarLibro()
                }
              }}
            />
            <Button
              type="button"
              variant="light"
              loading={buscandoObras}
              onClick={() => void buscarLibro()}
            >
              Buscar libro
            </Button>
          </Group>
          {sinResultados && (
            <Alert color="yellow" variant="light" role="status">
              No se encontró ningún libro con ese título.
            </Alert>
          )}
          <Select
            label="Libro"
            withAsterisk
            placeholder={obras.length ? 'Elija el libro' : 'Primero busque el libro'}
            data={obras.map((o) => ({ value: o.id, label: o.title }))}
            value={obraId}
            onChange={setObraId}
            error={errores.obra}
            disabled={guardando}
          />
          <TextInput
            label="Código de inventario"
            withAsterisk
            placeholder="Ej. CLENA-0042-1"
            value={codigo}
            onChange={(e) => setCodigo(e.currentTarget.value)}
            error={errores.codigo}
            disabled={guardando}
          />
          <Select
            label="Ubicación (sala › sección › estante)"
            withAsterisk
            placeholder="Elija el estante"
            data={estantes.map((e) => ({ value: e.id, label: rotuloEstante(e) }))}
            value={estanteId}
            onChange={setEstanteId}
            error={errores.estante}
            searchable
            nothingFoundMessage="No hay estantes con ese nombre"
            disabled={guardando}
          />
          <Select
            label="Estado inicial"
            data={OPCIONES_ESTADO}
            value={estado}
            onChange={setEstado}
            allowDeselect={false}
            disabled={guardando}
          />
          <Group>
            <Button type="submit" loading={guardando}>
              Registrar ejemplar
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  )
}
