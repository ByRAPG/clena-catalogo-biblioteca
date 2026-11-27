import { useEffect, useState, type FormEvent } from 'react'
import {
  Alert,
  Anchor,
  Button,
  Group,
  Select,
  Stack,
  TagsInput,
  Text,
  TextInput,
} from '@mantine/core'
import { Link } from 'react-router-dom'
import { EncabezadoSeccion } from '../../shared/ui/encabezado-seccion'
import { IconoAlerta, IconoCheck } from '../../shared/ui/iconos'
import { useSesion } from '../auth/sesion-context'
import { listarCategorias, type OpcionDeFiltro } from '../search/busqueda.api'
import { registrarObra, type ObraRegistrada } from './registrar-obra.api'
import { useSugerencias } from './use-sugerencias'

interface Errores {
  titulo?: string
  autores?: string
  anio?: string
}

const AYUDA_LISTA =
  'Escriba el nombre y presione Enter para agregar otro. Si aparece en la lista, elíjalo para no repetirlo.'

/** Une lo ya agregado con lo que quedó escrito sin presionar Enter. */
function conPendiente(valores: string[], pendiente: string): string[] {
  const texto = pendiente.trim()
  return texto ? [...valores, texto] : valores
}

/** HU-10: el personal registra un libro con título, autores, temas, categoría y año. */
export function PaginaRegistrarLibro() {
  const { sesion } = useSesion()
  const [titulo, setTitulo] = useState('')
  const [autores, setAutores] = useState<string[]>([])
  const [autorEscrito, setAutorEscrito] = useState('')
  const [temas, setTemas] = useState<string[]>([])
  const [temaEscrito, setTemaEscrito] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [anio, setAnio] = useState('')
  const [categorias, setCategorias] = useState<OpcionDeFiltro[]>([])
  const [errores, setErrores] = useState<Errores>({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [registrada, setRegistrada] = useState<ObraRegistrada | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const sugerenciasAutores = useSugerencias('authors', autorEscrito, sesion?.token)
  const sugerenciasTemas = useSugerencias('subjects', temaEscrito, sesion?.token)

  useEffect(() => {
    const control = new AbortController()
    listarCategorias(control.signal)
      .then((respuesta) => setCategorias(respuesta.data))
      // La categoría es opcional: el formulario sirve aunque no carguen.
      .catch(() => undefined)
    return () => control.abort()
  }, [])

  function validar(listaAutores: string[]): Errores {
    const nuevos: Errores = {}
    if (!titulo.trim()) nuevos.titulo = 'Escriba el título del libro'
    if (listaAutores.length === 0) nuevos.autores = 'Escriba al menos un autor'
    const anioLimpio = anio.trim()
    const ultimoAnio = new Date().getFullYear() + 1
    if (
      anioLimpio &&
      (!/^\d{1,4}$/.test(anioLimpio) ||
        Number(anioLimpio) < 1 ||
        Number(anioLimpio) > ultimoAnio)
    ) {
      nuevos.anio = `Escriba un año entre 1 y ${ultimoAnio}`
    }
    return nuevos
  }

  function limpiar() {
    setTitulo('')
    setAutores([])
    setAutorEscrito('')
    setTemas([])
    setTemaEscrito('')
    setCategoria(null)
    setAnio('')
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!sesion || ocupado) return
    setErrorGeneral('')
    setRegistrada(null)
    const listaAutores = conPendiente(autores, autorEscrito)
    const nuevosErrores = validar(listaAutores)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setOcupado(true)
    try {
      const obra = await registrarObra(
        {
          title: titulo.trim(),
          authors: listaAutores,
          subjects: conPendiente(temas, temaEscrito),
          categoryId: categoria ?? undefined,
          year: anio.trim() ? Number(anio) : undefined,
        },
        sesion.token,
      )
      setRegistrada(obra)
      limpiar()
    } catch (causa: unknown) {
      setErrorGeneral(
        causa instanceof Error ? causa.message : 'No se pudo registrar el libro',
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
          { texto: 'Registrar libro' },
        ]}
        volver={{ texto: 'Volver al panel de gestión', to: '/gestion' }}
        foto="interior"
        tono="granate"
        rotulo="Catálogo"
        titulo="Registrar un libro nuevo"
        descripcion="Los campos con asterisco son obligatorios. Los ejemplares y su ubicación se registran después."
      />

      {registrada && (
        <Alert
          color="green"
          className="alerta-exito"
          title="Libro registrado"
          icon={<IconoCheck />}
          role="status"
        >
          <Stack gap="xs">
            <Text>«{registrada.title}» ya aparece en la búsqueda pública.</Text>
            <Anchor component={Link} to={`/obras/${registrada.id}`}>
              Ver la ficha del libro
            </Anchor>
            <Anchor
              component={Link}
              to={`/gestion/ejemplares?${new URLSearchParams({
                obra: registrada.id,
                titulo: registrada.title,
              }).toString()}`}
            >
              Agregar sus ejemplares
            </Anchor>
            <Group gap="sm">
              <Button
                type="button"
                variant="default"
                style={{ minHeight: 44 }}
                onClick={() => {
                  setRegistrada(null)
                  document.getElementById('campo-titulo-libro')?.focus()
                }}
              >
                Registrar otro libro
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
          </Stack>
        </Alert>
      )}
      {errorGeneral && (
        <Alert
          color="red"
          className="alerta-error"
          title="No se pudo registrar el libro"
          icon={<IconoAlerta />}
          role="alert"
        >
          {errorGeneral}
        </Alert>
      )}

      <form onSubmit={guardar} noValidate className="formulario-grupos">
        <fieldset className="grupo-campos grupo-marino" disabled={ocupado}>
          <legend className="rotulo">Datos principales</legend>
          <TextInput
            id="campo-titulo-libro"
            label="Título"
            description="Como aparece en la portada del libro."
            withAsterisk
            value={titulo}
            error={errores.titulo}
            onChange={(e) => setTitulo(e.currentTarget.value)}
          />
          <TagsInput
            label="Autores"
            withAsterisk
            description={`${AYUDA_LISTA} El primero es el autor principal.`}
            data={sugerenciasAutores}
            value={autores}
            onChange={setAutores}
            searchValue={autorEscrito}
            onSearchChange={setAutorEscrito}
            splitChars={[';']}
            error={errores.autores}
            clearable
          />
        </fieldset>

        <fieldset className="grupo-campos grupo-granate" disabled={ocupado}>
          <legend className="rotulo">Clasificación</legend>
          <TagsInput
            label="Temas"
            description={AYUDA_LISTA}
            data={sugerenciasTemas}
            value={temas}
            onChange={setTemas}
            searchValue={temaEscrito}
            onSearchChange={setTemaEscrito}
            splitChars={[';']}
            clearable
          />
          <div className="campos-en-fila">
            <Select
              label="Categoría"
              description="Opcional."
              placeholder="Sin categoría"
              data={categorias.map((c) => ({ value: c.id, label: c.name }))}
              value={categoria}
              onChange={setCategoria}
              searchable
              clearable
            />
            <TextInput
              label="Año"
              description="Opcional, de 1 a 4 cifras."
              inputMode="numeric"
              maxLength={4}
              value={anio}
              error={errores.anio}
              onChange={(e) => setAnio(e.currentTarget.value)}
            />
          </div>
        </fieldset>

        <div className="acciones-formulario grupo-acciones">
          <Button type="submit" loading={ocupado} size="lg" className="boton-guardar">
            Guardar libro
          </Button>
          <Button component={Link} to="/gestion" variant="default">
            Volver a gestión del catálogo
          </Button>
        </div>
      </form>
    </div>
  )
}
