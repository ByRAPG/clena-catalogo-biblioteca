import { useEffect, useState, type FormEvent } from 'react'
import {
  Alert,
  Anchor,
  Button,
  Select,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { Link } from 'react-router-dom'
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
    <Stack gap="lg">
      <Title order={2}>Registrar un libro nuevo</Title>
      <Text>
        Los campos con asterisco son obligatorios. Los ejemplares y su ubicación
        se registran después.
      </Text>
      <Anchor component={Link} to="/gestion">
        Volver a gestión del catálogo
      </Anchor>

      {registrada && (
        <Alert color="green" title="Libro registrado">
          <Stack gap="xs">
            <Text>«{registrada.title}» ya aparece en la búsqueda pública.</Text>
            <Anchor component={Link} to={`/obras/${registrada.id}`}>
              Ver la ficha del libro
            </Anchor>
          </Stack>
        </Alert>
      )}
      {errorGeneral && (
        <Alert color="red" title="No se pudo registrar el libro">
          {errorGeneral}
        </Alert>
      )}

      <form onSubmit={guardar} noValidate>
        <Stack>
          <TextInput
            label="Título"
            withAsterisk
            value={titulo}
            error={errores.titulo}
            disabled={ocupado}
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
            disabled={ocupado}
            clearable
          />
          <TagsInput
            label="Temas"
            description={AYUDA_LISTA}
            data={sugerenciasTemas}
            value={temas}
            onChange={setTemas}
            searchValue={temaEscrito}
            onSearchChange={setTemaEscrito}
            splitChars={[';']}
            disabled={ocupado}
            clearable
          />
          <Select
            label="Categoría"
            placeholder="Sin categoría"
            data={categorias.map((c) => ({ value: c.id, label: c.name }))}
            value={categoria}
            onChange={setCategoria}
            disabled={ocupado}
            searchable
            clearable
          />
          <TextInput
            label="Año"
            inputMode="numeric"
            maxLength={4}
            value={anio}
            error={errores.anio}
            disabled={ocupado}
            onChange={(e) => setAnio(e.currentTarget.value)}
          />
          <Button type="submit" loading={ocupado}>
            Guardar libro
          </Button>
        </Stack>
      </form>
    </Stack>
  )
}
