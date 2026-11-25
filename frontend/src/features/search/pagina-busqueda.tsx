import {
  Alert,
  Button,
  Checkbox,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError, type Paginado } from '../../shared/api/client'
import { EVENTO_TUTORIAL } from '../tutorial/pasos'
import { TutorialBusqueda } from '../tutorial/tutorial-busqueda'
import { LOGO_LLEVA_NOMBRE, LogoMarca } from '../../shared/ui/marca'
import {
  buscarObras,
  listarCategorias,
  listarSalas,
  TAMANO_DE_PAGINA,
  type ObraResumen,
  type OpcionDeFiltro,
} from './busqueda.api'
import {
  CuadroMarca,
  RejillaCuadros,
} from '../../shared/ui/cuadro-marca'
import {
  IconoAyuda,
  IconoCheck,
  IconoLupa,
  IconoSala,
} from '../../shared/ui/iconos'
import { CampoBusqueda } from './campo-busqueda'
import { FranjaFoto } from '../../shared/ui/franja-foto'
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

/** Búsqueda de ejemplo del acceso «Busque por una idea». */
/** Nombre sin tildes ni mayúsculas, para hallar una sala por su nombre. */
function sinTildes(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Salas de los accesos 4, 5 y 6: las dos primeras y «Sala General»; si esta no
 * existe en los datos, la tercera sala. Sin repetir ninguna.
 */
function salasDeAcceso(salas: OpcionDeFiltro[]): OpcionDeFiltro[] {
  const general = salas.find((s) => sinTildes(s.name) === 'sala general')
  const candidatas = [...salas.slice(0, 2), ...(general ? [general] : []), ...salas]
  return candidatas.filter((s, i) => candidatas.findIndex((c) => c.id === s.id) === i).slice(0, 3)
}

const BUSQUEDA_DE_EJEMPLO = 'libros para niños'

interface AccesoRapido {
  clave: string
  icono: ReactNode
  titulo: string
  descripcion: string
  to?: string
  onClick?: () => void
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

  // Aviso «Ver accesos rápidos»: visible mientras el hero ocupa la pantalla; se
  // oculta al desplazarse (IntersectionObserver, sin escuchar el scroll).
  const heroRef = useRef<HTMLElement | null>(null)
  const [heroVisto, setHeroVisto] = useState(true)
  useEffect(() => {
    const hero = heroRef.current
    if (hero === null || typeof IntersectionObserver === 'undefined') return
    const observador = new IntersectionObserver(
      ([entrada]) => setHeroVisto(entrada.intersectionRatio > 0.9),
      { threshold: [0.9] },
    )
    observador.observe(hero)
    return () => observador.disconnect()
  }, [])

  function bajarAAccesos() {
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
    const titulo = document.getElementById('titulo-accesos')
    document
      .getElementById('accesos')
      ?.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'start' })
    titulo?.focus({ preventScroll: true })
  }

  // Seis accesos: dos fijos de uso (recorrido y disponibles), una búsqueda de
  // ejemplo por significado y tres salas de los datos ya cargados: las dos
  // primeras y «Sala General» (por nombre; si no existe, la tercera sala).
  const accesos: AccesoRapido[] = [
    {
      clave: 'como-buscar',
      icono: <IconoAyuda />,
      titulo: 'Cómo buscar',
      descripcion: 'Un recorrido guiado sobre esta pantalla para encontrar un libro.',
      onClick: () => window.dispatchEvent(new Event(EVENTO_TUTORIAL)),
    },
    {
      clave: 'disponibles',
      icono: <IconoCheck />,
      titulo: 'Solo disponibles',
      descripcion: 'Libros con algún ejemplar para llevar hoy.',
      to: '/?disponibles=true',
    },
    {
      clave: 'idea',
      icono: <IconoLupa />,
      titulo: 'Busque por una idea',
      descripcion: 'Describa lo que quiere y verá libros por su significado, por ejemplo «libros para niños».',
      to: `/?q=${encodeURIComponent(BUSQUEDA_DE_EJEMPLO)}`,
    },
    ...salasDeAcceso(salas).map((s) => ({
      clave: `sala-${s.id}`,
      icono: <IconoSala />,
      titulo: s.name,
      descripcion: 'Ver los libros que están en esta sala.',
      to: `/?sala=${s.id}`,
    })),
  ]

  const hayFiltros = categoria !== '' || sala !== '' || soloDisponibles
  const hayBusqueda = q !== '' || hayFiltros
  const total = resultado?.meta.total ?? 0
  const totalDePaginas = Math.max(1, Math.ceil(total / TAMANO_DE_PAGINA))
  const obras = resultado?.data ?? []

  return (
    <div className="portada">
      <section
        ref={heroRef}
        aria-label="Buscador del catálogo"
        className={`zona-hero${hayBusqueda ? ' hero-compacto zona-hero-compacta' : ''}`}
      >
        {/* Capa de fondo: foto con filtro azul marino a todo el ancho. */}
        <FranjaFoto foto="pov" tono="marino" className="hero zona-hero-fondo" aria-hidden="true" />
        <div className="zona-hero-contenido zona-fila">
          <div className="hero-cabeza">
            <div className="hero-textos">
              <Title order={1} className="hero-titulo">
                {LOGO_LLEVA_NOMBRE ? (
                  <LogoMarca size={129} titulo="Busca Fácil" className="hero-logo" />
                ) : (
                  'Busca Fácil'
                )}
              </Title>
              <p className="hero-eyebrow">Catálogo de la Biblioteca del CLENA</p>
              <p className="hero-subtitulo">
                Busque un libro por título, autor o tema y vea en qué sala,
                sección y estante está.
              </p>
            </div>
            <TutorialBusqueda />
          </div>

          <div className="hero-vidrio" data-tutorial="buscador">
            <form onSubmit={enviar} role="search" aria-label="Buscar en el catálogo">
              <Group align="flex-end" gap="sm" wrap="wrap">
                {/* `key` vuelve a montar el campo cuando la búsqueda de la URL
                    cambia (por ejemplo al pulsar «atrás»), sin sincronizarlo a mano. */}
                <CampoBusqueda key={q} valorInicial={q} />
                <Button type="submit" style={{ minHeight: 44 }}>
                  Buscar
                </Button>
              </Group>
            </form>
          </div>

          <FranjaFoto
            foto="interior"
            tono="ambar"
            className="filtros"
            data-tutorial="filtros"
          >
            <Group align="flex-end" gap="sm" wrap="wrap">
              <Select
                label="Categoría"
                placeholder="Todas"
                data={aOpciones(categorias)}
                value={categoria === '' ? null : categoria}
                onChange={(valor) => cambiar({ categoria: valor })}
                clearable
                className="filtro-select"
              />
              <Select
                label="Sala"
                placeholder="Todas"
                data={aOpciones(salas)}
                value={sala === '' ? null : sala}
                onChange={(valor) => cambiar({ sala: valor })}
                clearable
                className="filtro-select"
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
          </FranjaFoto>
        </div>

        {!hayBusqueda && (
          <button
            type="button"
            className="hero-bajar"
            data-oculto={!heroVisto}
            tabIndex={heroVisto ? 0 : -1}
            onClick={bajarAAccesos}
          >
            Ver accesos rápidos
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M5 9l7 7 7-7" />
            </svg>
          </button>
        )}
      </section>

      {!hayBusqueda && (
        <FranjaFoto
          as="section"
          aria-labelledby="titulo-accesos"
          foto="interior"
          tono="granate"
          id="accesos"
          className="seccion-accesos zona-accesos"
        >
          <div className="zona-accesos-fila">
          <h2 id="titulo-accesos" className="rotulo" tabIndex={-1}>
            Accesos rápidos
          </h2>
          <RejillaCuadros etiqueta="Accesos rápidos al catálogo">
            {accesos.map((acceso, i) => (
              <CuadroMarca
                key={acceso.clave}
                tono={i % 2 === 0 ? 'azul' : 'granate'}
                numero={String(i + 1).padStart(2, '0')}
                icono={acceso.icono}
                titulo={acceso.titulo}
                descripcion={acceso.descripcion}
                to={acceso.to}
                onClick={acceso.onClick}
              />
            ))}
          </RejillaCuadros>
          </div>
        </FranjaFoto>
      )}

      <Stack gap="lg" className="portada-resultados">
      {/* Un lector de pantalla anuncia el conteo sin que haya que ir a buscarlo. */}
      <div aria-live="polite" aria-atomic="true">
        {cargando && (
          <Group gap="sm">
            <Loader size="sm" />
            <Text>Buscando…</Text>
          </Group>
        )}
        {!cargando && error === null && resultado !== null && (
          <Text className="rotulo">
            {total === 0
              ? 'Sin resultados'
              : `${total} ${total === 1 ? 'resultado' : 'resultados'}`}
          </Text>
        )}
      </div>

      {!cargando && error === null && resultado?.meta.degraded === true && q !== '' && (
        <p className="aviso-discreto" role="status">
          La búsqueda por significado no está disponible en este momento; se
          muestran las coincidencias por palabras.
        </p>
      )}

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
          data-tutorial="primer-resultado"
          data-tutorial-hijo="primero"
          style={{ listStyle: 'none', margin: 0, padding: 0 }}
        >
          {obras.map((obra, i) => (
            <TarjetaResultado
              key={obra.id}
              obra={obra}
              consulta={q}
              numero={(pagina - 1) * TAMANO_DE_PAGINA + i + 1}
            />
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
    </div>
  )
}
