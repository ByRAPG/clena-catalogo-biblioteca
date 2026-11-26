import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '../../shared/theme/theme'
import { CLAVE_TUTORIAL_VISTO } from '../tutorial/tutorial-visto'
import type { ObraResumen } from './busqueda.api'
import { PaginaBusqueda } from './pagina-busqueda'

const ID_SALA = '5b0f7d4e-1c1e-5a53-a3f1-0d7f4a2c9e11'
const ID_CATEGORIA = '7c1f8e2a-3b4d-4c5e-9f10-2a3b4c5d6e7f'

const CIEN_ANOS: ObraResumen = {
  id: 'a1b2c3d4-0000-4000-8000-000000000001',
  title: 'Cien años de soledad',
  authors: ['Gabriel García Márquez'],
  subjects: ['Realismo mágico'],
  category: { id: ID_CATEGORIA, name: 'Literatura' },
  year: 1967,
  matchedOn: 'title',
  availability: {
    status: 'DISPONIBLE',
    reason: null,
    availableCopies: 2,
    totalCopies: 3,
    hasDigital: false,
  },
  location: { room: 'Sala General', section: 'Literatura Latinoamericana', shelf: 'A-03' },
}

const PRESTADA: ObraResumen = {
  ...CIEN_ANOS,
  id: 'a1b2c3d4-0000-4000-8000-000000000002',
  title: 'El otoño del patriarca',
  availability: {
    status: 'NO_DISPONIBLE',
    reason: 'PRESTADO',
    availableCopies: 0,
    totalCopies: 1,
    hasDigital: false,
  },
}

/** URL de cada llamada a `fetch`, en orden, para comprobar lo que se envió. */
let urlesPedidas: string[] = []

/**
 * Responde según la ruta. `obras` es lo que devuelve `/search/works`; si es un
 * `Error`, la petición de búsqueda falla y las de los filtros siguen bien.
 */
function simularApi(
  obras: ObraResumen[] | Error,
  total?: number,
  meta: Record<string, unknown> = {},
  salas: { id: string; name: string }[] = [{ id: ID_SALA, name: 'Sala General' }],
) {
  vi.stubGlobal(
    'fetch',
    vi.fn((entrada: string) => {
      urlesPedidas.push(entrada)

      if (entrada.includes('/search/categories')) {
        return Promise.resolve(
          Response.json({ data: [{ id: ID_CATEGORIA, name: 'Literatura' }] }),
        )
      }
      if (entrada.includes('/search/rooms')) {
        return Promise.resolve(
          Response.json({ data: salas }),
        )
      }
      if (obras instanceof Error) return Promise.reject(obras)
      return Promise.resolve(
        Response.json({
          data: obras,
          meta: { page: 1, pageSize: 10, total: total ?? obras.length, ...meta },
        }),
      )
    }),
  )
}

function pintar(ruta = '/') {
  return render(
    <MantineProvider theme={theme} defaultColorScheme="light">
      <MemoryRouter initialEntries={[ruta]}>
        <PaginaBusqueda />
      </MemoryRouter>
    </MantineProvider>,
  )
}

/** La URL de búsqueda más reciente, ya descompuesta en parámetros. */
function parametrosDeLaBusqueda(): URLSearchParams {
  const url = [...urlesPedidas].reverse().find((u) => u.includes('/search/works'))
  if (url === undefined) throw new Error('no se pidió /search/works')
  return new URL(url).searchParams
}

beforeEach(() => {
  urlesPedidas = []
  // El tutorial se abre solo en la primera visita y su Modal taparía la
  // pantalla: en las pruebas se marca como ya visto.
  localStorage.setItem(CLAVE_TUTORIAL_VISTO, 'true')
})

describe('Pantalla de búsqueda', () => {
  it('muestra el campo de búsqueda y el botón Buscar', async () => {
    simularApi([])
    pintar()

    expect(
      screen.getByRole('textbox', { name: /busque por título, autor o tema/i }),
    ).toBeDefined()
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDefined()
    await screen.findByText('Sin resultados')
  })

  it('ofrece «Ver accesos rápidos» solo sin búsqueda y baja a la sección de accesos', async () => {
    simularApi([])
    const { unmount } = pintar()
    const bajar = screen.getByRole('button', { name: 'Ver accesos rápidos' })
    const sinMover = vi.fn()
    HTMLElement.prototype.scrollIntoView = sinMover
    fireEvent.click(bajar)
    expect(sinMover).toHaveBeenCalledTimes(1)
    await screen.findByText('Sin resultados')
    unmount()

    simularApi([CIEN_ANOS])
    pintar('/?q=cien')
    expect(screen.queryByRole('button', { name: 'Ver accesos rápidos' })).toBeNull()
    await screen.findByRole('listitem')
  })

  it('lista los resultados con autor, tema, disponibilidad y ubicación', async () => {
    simularApi([CIEN_ANOS])
    pintar()

    expect(await screen.findByText('Cien años de soledad')).toBeDefined()

    // Se consulta dentro de la tarjeta: «Sala General» también es una opción
    // del filtro de sala, y fuera de la tarjeta habría dos coincidencias.
    const tarjeta = screen.getByRole('listitem')
    expect(within(tarjeta).getByText(/Gabriel García Márquez/)).toBeDefined()
    expect(within(tarjeta).getByText(/Realismo mágico/)).toBeDefined()
    expect(within(tarjeta).getByText('Disponible')).toBeDefined()
    expect(within(tarjeta).getByText(/2 de 3 ejemplares/)).toBeDefined()
    expect(within(tarjeta).getByText(/Sala General/)).toBeDefined()
    expect(within(tarjeta).getByText(/A-03/)).toBeDefined()
    expect(screen.getByText('1 resultado')).toBeDefined()
  })

  it('dice en texto el motivo cuando la obra no está disponible', async () => {
    simularApi([PRESTADA])
    pintar()

    expect(await screen.findByText('No disponible')).toBeDefined()
    expect(screen.getByText('Prestado')).toBeDefined()
  })

  it('muestra un mensaje claro cuando no hay resultados', async () => {
    simularApi([])
    pintar()

    expect(await screen.findByText(/No encontramos libros/)).toBeDefined()
    expect(screen.getByText('Sin resultados')).toBeDefined()
  })

  it('repite la consulta escrita y sugiere qué hacer, sin filtros (HU-07)', async () => {
    simularApi([], 0)
    pintar('/?q=gabrial garsia')

    // El bloque es una región con nombre: se encuentra navegando por
    // regiones, sin que el lector lo lea entero de un tirón al aparecer.
    const aviso = await screen.findByRole('region', {
      name: /No encontramos libros/,
    })

    // Ver lo escrito es lo que deja descubrir el error de ortografía.
    expect(within(aviso).getByText('«gabrial garsia»')).toBeDefined()
    expect(within(aviso).getByText(/Revise la ortografía/)).toBeDefined()
    expect(within(aviso).getByText(/palabras más generales/)).toBeDefined()
    expect(within(aviso).getByText(/mostrador/)).toBeDefined()

    // Sin filtros puestos no se ofrece quitarlos.
    expect(
      within(aviso).queryByRole('button', {
        name: 'Quitar los filtros y buscar de nuevo',
      }),
    ).toBeNull()
  })

  it('enlaza tres temas de la portada cuando no hay resultados (HU-07)', async () => {
    simularApi([], 0)
    pintar('/?q=zzzz')
    const aviso = await screen.findByRole('region', {
      name: /No encontramos libros/,
    })

    const temas = within(aviso).getAllByRole('link')
    expect(temas).toHaveLength(3)
    expect(temas.map((t) => t.getAttribute('href'))).toEqual([
      '/?q=Historia%20del%20Caribe',
      '/?q=Cuentos%20infantiles',
      '/?q=Poes%C3%ADa%20contempor%C3%A1nea',
    ])
  })

  it('con filtros puestos, «Quitar los filtros» limpia la URL y deja la consulta (HU-07)', async () => {
    simularApi([], 0)
    pintar(`/?q=cien&sala=${ID_SALA}&disponibles=true`)
    const aviso = await screen.findByRole('region', {
      name: /No encontramos libros/,
    })

    expect(within(aviso).getByText(/Quite los filtros/)).toBeDefined()
    fireEvent.click(
      within(aviso).getByRole('button', {
        name: 'Quitar los filtros y buscar de nuevo',
      }),
    )

    await waitFor(() => {
      const enviados = parametrosDeLaBusqueda()
      expect(enviados.has('roomId')).toBe(false)
      expect(enviados.has('available')).toBe(false)
      expect(enviados.get('q')).toBe('cien')
    })
  })

  it('sin consulta y solo con filtros, no inventa una consulta escrita', async () => {
    simularApi([], 0)
    pintar('/?disponibles=true')
    const aviso = await screen.findByRole('region', {
      name: /No encontramos libros/,
    })

    expect(within(aviso).getByText(/No encontramos libros con esos filtros/)).toBeDefined()
    expect(within(aviso).queryByText(/Buscó:/)).toBeNull()
    expect(
      within(aviso).getByRole('button', {
        name: 'Quitar los filtros y buscar de nuevo',
      }),
    ).toBeDefined()
  })

  it('avisa del fallo de red y deja intentar de nuevo', async () => {
    simularApi(new TypeError('offline'))
    pintar()

    expect(await screen.findByRole('alert')).toBeDefined()
    expect(
      screen.getByText(/No pudimos conectarnos con el servidor/),
    ).toBeDefined()
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeDefined()
  })

  it('envía el texto escrito al presionar Buscar', async () => {
    simularApi([CIEN_ANOS])
    pintar()
    await screen.findByText('Cien años de soledad')

    const campo = screen.getByRole('textbox', {
      name: /busque por título, autor o tema/i,
    })
    fireEvent.change(campo, { target: { value: 'cien años sole' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    await waitFor(() => {
      expect(parametrosDeLaBusqueda().get('q')).toBe('cien años sole')
    })
  })

  it('pide 10 resultados por página, como exige HU-01', async () => {
    simularApi([CIEN_ANOS])
    pintar()
    await screen.findByText('Cien años de soledad')

    expect(parametrosDeLaBusqueda().get('pageSize')).toBe('10')
  })

  it('aplica la sala que llega del QR en ?sala=', async () => {
    simularApi([CIEN_ANOS])
    pintar(`/?sala=${ID_SALA}`)
    await screen.findByText('Cien años de soledad')

    expect(parametrosDeLaBusqueda().get('roomId')).toBe(ID_SALA)
  })

  it('ignora una sala inventada en la URL en vez de pedirla al backend', async () => {
    simularApi([CIEN_ANOS])
    pintar('/?sala=no-es-un-uuid')
    await screen.findByText('Cien años de soledad')

    expect(parametrosDeLaBusqueda().has('roomId')).toBe(false)
  })

  it('envía available=true al marcar «Solo disponibles»', async () => {
    simularApi([CIEN_ANOS])
    pintar()
    await screen.findByText('Cien años de soledad')

    fireEvent.click(screen.getByRole('checkbox', { name: 'Solo disponibles' }))

    await waitFor(() => {
      expect(parametrosDeLaBusqueda().get('available')).toBe('true')
    })
  })

  it('quita los filtros activos sin borrar la búsqueda', async () => {
    simularApi([CIEN_ANOS])
    pintar(`/?q=cien&sala=${ID_SALA}&disponibles=true`)
    await screen.findByRole('link', { name: 'Cien años de soledad' })

    fireEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }))

    await waitFor(() => {
      const enviados = parametrosDeLaBusqueda()
      expect(enviados.has('roomId')).toBe(false)
      expect(enviados.has('available')).toBe(false)
      expect(enviados.get('q')).toBe('cien')
    })
  })

  it('avisa y enlaza la primera página si ?pagina= no es un entero', async () => {
    simularApi([CIEN_ANOS], 42)
    pintar('/?q=cien&pagina=1.5')

    expect(await screen.findByText('Esta página no existe')).toBeDefined()
    // No se pide 1.5 al backend: con un decimal responde 400.
    expect(parametrosDeLaBusqueda().get('page')).toBe('1')
    // Ni conteo ni lista: lo que se pidió no existe.
    expect(screen.queryByText('42 resultados')).toBeNull()
    expect(screen.queryByRole('listitem')).toBeNull()

    const enlace = screen.getByRole('link', { name: 'Ver la primera página' })
    expect(enlace.getAttribute('href')).toBe('/?q=cien')
  })

  it('avisa si ?pagina= se pasa del total de páginas', async () => {
    simularApi([], 42)
    pintar('/?q=cien&pagina=9999')

    expect(await screen.findByText('Esta página no existe')).toBeDefined()
    expect(screen.getByText('Esta búsqueda llega hasta la página 5.')).toBeDefined()
    expect(screen.queryByText('42 resultados')).toBeNull()
  })

  it('acepta una página que sí existe', async () => {
    simularApi([CIEN_ANOS], 42)
    pintar('/?q=cien&pagina=3')

    expect(await screen.findByText('42 resultados')).toBeDefined()
    expect(screen.queryByText('Esta página no existe')).toBeNull()
    expect(parametrosDeLaBusqueda().get('page')).toBe('3')
  })

  it('sin resultados, manda el mensaje de HU-07 y no el de página inexistente', async () => {
    simularApi([], 0)
    pintar('/?q=zzzz&pagina=4')

    expect(await screen.findByText(/No encontramos libros/)).toBeDefined()
    expect(screen.queryByText('Esta página no existe')).toBeNull()
  })

  it('conserva el tutorial de la primera búsqueda', async () => {
    simularApi([])
    pintar()
    await screen.findByText('Sin resultados')

    expect(screen.getByRole('button', { name: '¿Cómo buscar?' })).toBeDefined()
  })

  it('resalta los términos de la consulta sin tildes ni mayúsculas', async () => {
    simularApi([CIEN_ANOS])
    const { container } = pintar('/?q=ANOS cien')
    await screen.findByRole('link', { name: 'Cien años de soledad' })

    const marcas = [...container.querySelectorAll('mark')].map((m) => m.textContent)
    expect(marcas).toContain('Cien')
    expect(marcas).toContain('años')
  })

  it('muestra la insignia solo cuando la coincidencia es por significado', async () => {
    simularApi([
      { ...CIEN_ANOS, matchSource: 'semantic' },
      { ...PRESTADA, matchSource: 'lexical' },
    ])
    pintar('/?q=soledad')
    await screen.findByRole('link', { name: 'Cien años de soledad' })

    expect(screen.getAllByText('Coincide por significado')).toHaveLength(1)
  })

  it('avisa con discreción si la búsqueda por significado no está disponible', async () => {
    simularApi([CIEN_ANOS], undefined, { mode: 'lexical', degraded: true })
    pintar('/?q=cien')
    await screen.findByRole('link', { name: 'Cien años de soledad' })

    expect(screen.getByText(/búsqueda por significado no está disponible/)).toBeDefined()
  })

  it('en la portada ofrece accesos rápidos reales', async () => {
    simularApi([CIEN_ANOS])
    pintar()
    const accesos = await screen.findByRole('group', { name: 'Accesos rápidos al catálogo' })

    expect(within(accesos).getByRole('link', { name: /Solo disponibles/ })).toBeDefined()
    expect(await within(accesos).findByRole('link', { name: /Sala General/ })).toBeDefined()
    expect(within(accesos).getByRole('button', { name: /Cómo buscar/ })).toBeDefined()
    const idea = within(accesos).getByRole('link', { name: /Busque por una idea/ })
    expect(idea.getAttribute('href')).toBe('/?q=libros%20para%20ni%C3%B1os')
    expect(within(accesos).getAllByRole('link').length + 1).toBeLessThanOrEqual(6)
  })

  it('ordena los accesos 4, 5 y 6 como Hemeroteca, Sala Caribe y Sala General', async () => {
    simularApi([CIEN_ANOS], undefined, {}, [
      { id: 'a', name: 'Hemeroteca' },
      { id: 'b', name: 'Sala Caribe' },
      { id: 'c', name: 'Sala Infantil' },
      { id: 'd', name: 'Sala General' },
    ])
    pintar()
    const accesos = await screen.findByRole('group', { name: 'Accesos rápidos al catálogo' })

    await within(accesos).findByRole('link', { name: /Sala General/ })
    const titulos = within(accesos)
      .getAllByRole('link')
      .map((enlace) => enlace.querySelector('.cuadro-titulo')?.textContent)
    expect(titulos.slice(-3)).toEqual(['Hemeroteca', 'Sala Caribe', 'Sala General'])
    expect(within(accesos).queryByRole('link', { name: /Sala Infantil/ })).toBeNull()
  })

  it('si no existe «Sala General» el acceso 6 es la tercera sala', async () => {
    simularApi([CIEN_ANOS], undefined, {}, [
      { id: 'a', name: 'Hemeroteca' },
      { id: 'b', name: 'Sala Caribe' },
      { id: 'c', name: 'Sala Infantil' },
    ])
    pintar()
    const accesos = await screen.findByRole('group', { name: 'Accesos rápidos al catálogo' })

    expect(await within(accesos).findByRole('link', { name: /Sala Infantil/ })).toBeDefined()
    expect(within(accesos).getAllByRole('link')).toHaveLength(5)
  })

  it('titula la portada «Busca Fácil» con un solo h1 y el rótulo del catálogo', () => {
    simularApi([CIEN_ANOS])
    const { container } = pintar()

    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Busca Fácil' })).toBeDefined()
    expect(screen.getByText('Catálogo de la Biblioteca del CLENA')).toBeDefined()
  })
})
