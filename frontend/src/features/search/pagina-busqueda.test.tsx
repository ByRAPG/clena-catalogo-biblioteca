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
function simularApi(obras: ObraResumen[] | Error, total?: number) {
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
          Response.json({ data: [{ id: ID_SALA, name: 'Sala General' }] }),
        )
      }
      if (obras instanceof Error) return Promise.reject(obras)
      return Promise.resolve(
        Response.json({
          data: obras,
          meta: { page: 1, pageSize: 10, total: total ?? obras.length },
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

    expect(
      await screen.findByText(/No encontramos libros que coincidan/),
    ).toBeDefined()
    expect(screen.getByText('Sin resultados')).toBeDefined()
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
    await screen.findByText('Cien años de soledad')

    fireEvent.click(screen.getByRole('button', { name: 'Quitar filtros' }))

    await waitFor(() => {
      const enviados = parametrosDeLaBusqueda()
      expect(enviados.has('roomId')).toBe(false)
      expect(enviados.has('available')).toBe(false)
      expect(enviados.get('q')).toBe('cien')
    })
  })

  it('conserva el tutorial de la primera búsqueda', async () => {
    simularApi([])
    pintar()
    await screen.findByText('Sin resultados')

    expect(screen.getByRole('button', { name: '¿Cómo buscar?' })).toBeDefined()
  })
})
