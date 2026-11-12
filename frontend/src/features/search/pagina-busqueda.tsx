import {
  Alert,
  Button,
  Checkbox,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError, type Paginado } from '../../shared/api/client'
import { TutorialBusqueda } from '../tutorial/tutorial-busqueda'
import {
  buscarObras,
  listarCategorias,
  listarSalas,
  TAMANO_DE_PAGINA,
  type ObraResumen,
  type OpcionDeFiltro,
} from './busqueda.api'
import { Paginador } from './paginador'
import { esUuid, leerSalaDeLaUrl } from './sala-url'
import { TarjetaResultado } from './tarjeta-resultado'

/**
 * Pantalla pública de búsqueda (HU-01, HU-02, HU-03, HU-06, HU-08).
 *
 * Los criterios viven en la URL, no en `useState`, por tres razones:
 * 1. El QR por sala entra como `?sala=<id>` (HU-05) y debe quedar aplicado.
 * 2. Una búsqueda con filtros se puede compartir o guardar como favorita.
 * 3. El botón «atrás» del navegador deshace el último filtro, que es lo que
 *    una persona espera.
 *
 * El texto se envía con el botón «Buscar» (criterio de HU-01); los filtros se
 * aplican al cambiarlos, sin recargar la página (criterio de HU-08).
 */

/** Última respuesta recibida, junto con los criterios que la produjeron. */
interface RespuestaRecibida {
  clave: string
  pagina: Paginado<ObraResumen> | null
  error: string | null
}

function mensajeDeFallo(causa: unknown): string {
  if (causa instanceof ApiError) {
    return causa.esFalloDeRed
      ? 'No pudimos conectarnos con el servidor. Revise su conexión e intente de nuevo.'
      : `No pudimos completar la búsqueda. ${causa.message}`
  }
  return 'No pudimos completar la búsqueda. Intente de nuevo.'
}

function aOpciones(opciones: OpcionDeFiltro[]) {
  return opciones.map((opcion) => ({ value: opcion.id, label: opcion.name }))
}

export function PaginaBusqueda() {
  const [parametros, setParametros] = useSearchParams()

  const q = parametros.get('q')?.trim() ?? ''
  const categoriaCruda = parametros.get('categoria')?.trim() ?? ''
  const categoria = esUuid(categoriaCruda) ? categoriaCruda : ''
  const sala = leerSalaDeLaUrl(parametros) ?? ''
  const soloDisponibles = parametros.get('disponibles') === 'true'
  const pagina = Math.max(1, Number(parametros.get('pagina') ?? '1') || 1)

  // Sube con «Intentar de nuevo»: cambia los criterios efectivos y repite la
  // consulta aunque la URL siga igual.
  const [intento, setIntento] = useState(0)
  const clave = [intento, q, categoria, sala, soloDisponibles, pagina].join('|')

  const [recibida, setRecibida] = useState<RespuestaRecibida | null>(null)
  const [categorias, setCategorias] = useState<OpcionDeFiltro[]>([])
  const [salas, setSalas] = useState<OpcionDeFiltro[]>([])

  // «Cargando» no se guarda: se deduce de comparar los criterios de ahora con
  // los de la última respuesta. Así el efecto no llama a setState de forma
  // síncrona, que es lo que provoca renders en cascada.
  const alDia = recibida !== null && recibida.clave === clave
  const cargando = !alDia
  const resultado = alDia ? recibida.pagina : null
  const error = alDia ? recibida.error : null

  // Las opciones de los filtros se piden una sola vez. Si fallan, los selects
  // quedan vacíos pero la búsqueda sigue funcionando: no se bloquea la pantalla.
  useEffect(() => {
    const controlador = new AbortController()
    void Promise.all([
      listarCategorias(controlador.signal),
      listarSalas(controlador.signal),
    ])
      .then(([respuestaCategorias, respuestaSalas]) => {
        if (controlador.signal.aborted) return
        setCategorias(respuestaCategorias.data)
        setSalas(respuestaSalas.data)
      })
      .catch(() => {
        // Sin filtros se puede buscar igual; no hay nada que avisar aquí.
      })
    return () => controlador.abort()
  }, [])

  useEffect(() => {
    const controlador = new AbortController()

    buscarObras(
      {
        q: q === '' ? undefined : q,
        categoryId: categoria === '' ? undefined : categoria,
        roomId: sala === '' ? undefined : sala,
        soloDisponibles,
        page: pagina,
      },
      controlador.signal,
    )
      .then((respuesta) => {
        if (controlador.signal.aborted) return
        setRecibida({ clave, pagina: respuesta, error: null })
      })
      .catch((causa: unknown) => {
        // Al cambiar un filtro se cancela la petición anterior: el cliente
        // traduce ese corte a un ApiError de red, y no es un fallo real.
        if (controlador.signal.aborted) return
        setRecibida({ clave, pagina: null, error: mensajeDeFallo(causa) })
      })

    return () => controlador.abort()
  }, [clave, q, categoria, sala, soloDisponibles, pagina])

  function cambiar(cambios: Record<string, string | null>) {
    const siguientes = new URLSearchParams(parametros)
    for (const [nombre, valor] of Object.entries(cambios)) {
      if (valor === null || valor === '') siguientes.delete(nombre)
      else siguientes.set(nombre, valor)
    }
    // Cualquier cambio de criterio vuelve a la primera página: quedarse en la
    // página 4 de un resultado nuevo deja la lista vacía sin explicación.
    siguientes.delete('pagina')
    setParametros(siguientes)
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    cambiar({ q: String(datos.get('q') ?? '').trim() })
  }

  const hayFiltros = categoria !== '' || sala !== '' || soloDisponibles
  const total = resultado?.meta.total ?? 0
  const totalDePaginas = Math.max(1, Math.ceil(total / TAMANO_DE_PAGINA))
  const obras = resultado?.data ?? []

  return (
    <Stack gap="lg">
      <Title order={2}>Catálogo CLENA</Title>
      <Text>
        Busque un libro por título, autor o tema y vea en qué sala, sección y
        estante está.
      </Text>

      <TutorialBusqueda />

      <form onSubmit={enviar} role="search" aria-label="Buscar en el catálogo">
        <Group align="flex-end" gap="sm" wrap="wrap">
          <TextInput
            // `key` vuelve a montar el campo cuando la búsqueda de la URL
            // cambia (por ejemplo al pulsar «atrás»), sin sincronizarlo a mano.
            key={q}
            name="q"
            label="Busque por título, autor o tema"
            placeholder="Por ejemplo: cien años sole"
            defaultValue={q}
            maxLength={100}
            style={{ flex: '1 1 18rem' }}
          />
          <Button type="submit" style={{ minHeight: 44 }}>
            Buscar
          </Button>
        </Group>
      </form>

      <Group align="flex-end" gap="sm" wrap="wrap">
        <Select
          label="Categoría"
          placeholder="Todas"
          data={aOpciones(categorias)}
          value={categoria === '' ? null : categoria}
          onChange={(valor) => cambiar({ categoria: valor })}
          clearable
          style={{ flex: '1 1 12rem' }}
        />
        <Select
          label="Sala"
          placeholder="Todas"
          data={aOpciones(salas)}
          value={sala === '' ? null : sala}
          onChange={(valor) => cambiar({ sala: valor })}
          clearable
          style={{ flex: '1 1 12rem' }}
        />
        <Checkbox
          label="Solo disponibles"
          checked={soloDisponibles}
          onChange={(evento) =>
            cambiar({
              disponibles: evento.currentTarget.checked ? 'true' : null,
            })
          }
          style={{ minHeight: 44, display: 'flex', alignItems: 'center' }}
        />
        {hayFiltros && (
          <Button
            type="button"
            variant="default"
            onClick={() =>
              cambiar({ categoria: null, sala: null, disponibles: null })
            }
            style={{ minHeight: 44 }}
          >
            Quitar filtros
          </Button>
        )}
      </Group>

      {/* Un lector de pantalla anuncia el conteo sin que haya que ir a buscarlo. */}
      <div aria-live="polite" aria-atomic="true">
        {cargando && (
          <Group gap="sm">
            <Loader size="sm" />
            <Text>Buscando…</Text>
          </Group>
        )}
        {!cargando && error === null && resultado !== null && (
          <Text fw={600}>
            {total === 0
              ? 'Sin resultados'
              : `${total} ${total === 1 ? 'resultado' : 'resultados'}`}
          </Text>
        )}
      </div>

      {error !== null && (
        <Alert color="red.9" title="No se pudo buscar" role="alert">
          <Stack gap="sm" align="flex-start">
            <Text>{error}</Text>
            <Button
              type="button"
              variant="default"
              onClick={() => setIntento((anterior) => anterior + 1)}
              style={{ minHeight: 44 }}
            >
              Intentar de nuevo
            </Button>
          </Stack>
        </Alert>
      )}

      {!cargando && error === null && resultado !== null && total === 0 && (
        <Stack gap="xs">
          <Text fz="lg">
            No encontramos libros que coincidan con lo que buscó.
          </Text>
          <Text>
            Revise la escritura, use menos palabras o quite los filtros. También
            puede pedir ayuda en el mostrador.
          </Text>
        </Stack>
      )}

      {obras.length > 0 && (
        <Stack
          component="ul"
          gap="md"
          style={{ listStyle: 'none', margin: 0, padding: 0 }}
        >
          {obras.map((obra) => (
            <TarjetaResultado key={obra.id} obra={obra} />
          ))}
        </Stack>
      )}

      {totalDePaginas > 1 && (
        <Paginador
          pagina={pagina}
          totalDePaginas={totalDePaginas}
          alCambiar={(siguiente) => {
            const siguientes = new URLSearchParams(parametros)
            if (siguiente <= 1) siguientes.delete('pagina')
            else siguientes.set('pagina', String(siguiente))
            setParametros(siguientes)
          }}
        />
      )}
    </Stack>
  )
}
