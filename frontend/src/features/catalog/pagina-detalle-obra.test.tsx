import { MantineProvider } from '@mantine/core'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '../../shared/theme/theme'
import type { ObraDetalle } from '../search/busqueda.api'
import { PaginaDetalleObra } from './pagina-detalle-obra'

const ID = 'a1b2c3d4-0000-4000-8000-000000000001'

const OBRA: ObraDetalle = {
  id: ID,
  title: 'Cien años de soledad',
  subtitle: null,
  authors: ['Gabriel García Márquez'],
  subjects: ['Realismo mágico'],
  category: { id: '7c1f8e2a-3b4d-4c5e-9f10-2a3b4c5d6e7f', name: 'Literatura' },
  year: 1967,
  matchedOn: null,
  availability: {
    status: 'DISPONIBLE',
    reason: null,
    availableCopies: 1,
    totalCopies: 2,
    hasDigital: true,
  },
  location: { room: 'Sala General', section: 'Literatura Latinoamericana', shelf: 'A-03' },
  publisher: 'Editorial Sudamericana',
  isbn: '978-0-00-000000-0',
  classification: '863',
  digitalUrl: 'https://example.org/biblioteca-digital/cien-anos',
  copies: [
    {
      inventoryCode: 'CLENA-0001-1',
      status: 'DISPONIBLE',
      room: 'Sala General',
      section: 'Literatura Latinoamericana',
      shelf: 'A-03',
    },
    {
      inventoryCode: 'CLENA-0001-2',
      status: 'PRESTADO',
      room: 'Sala Infantil',
      section: 'Clásicos adaptados',
      shelf: 'B-11',
    },
  ],
}

function simularRespuesta(cuerpo: unknown, estado = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(cuerpo), {
          status: estado,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ),
  )
}

function pintar() {
  return render(
    <MantineProvider theme={theme} defaultColorScheme="light">
      <MemoryRouter initialEntries={[`/obras/${ID}`]}>
        <Routes>
          <Route path="obras/:id" element={<PaginaDetalleObra />} />
        </Routes>
      </MemoryRouter>
    </MantineProvider>,
  )
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('Detalle de la obra', () => {
  it('muestra el título, el autor y los temas', async () => {
    simularRespuesta(OBRA)
    pintar()

    expect(
      await screen.findByRole('heading', { name: 'Cien años de soledad' }),
    ).toBeDefined()
    expect(screen.getByText(/Gabriel García Márquez/)).toBeDefined()
    expect(screen.getByText(/Realismo mágico/)).toBeDefined()
  })

  it('muestra la ubicación de cada ejemplar, no solo la del primero', async () => {
    simularRespuesta(OBRA)
    pintar()

    await screen.findByRole('heading', { name: 'Cien años de soledad' })
    const ejemplares = screen.getAllByRole('listitem')

    expect(ejemplares).toHaveLength(2)
    expect(within(ejemplares[0]).getByText('Sala General')).toBeDefined()
    expect(
      within(ejemplares[0]).getByText(/Sección Literatura Latinoamericana, estante A-03/),
    ).toBeDefined()
    expect(within(ejemplares[1]).getByText('Sala Infantil')).toBeDefined()
    expect(within(ejemplares[1]).getByText(/estante B-11/)).toBeDefined()
  })

  it('dice el estado de cada ejemplar en texto', async () => {
    simularRespuesta(OBRA)
    pintar()

    await screen.findByRole('heading', { name: 'Cien años de soledad' })
    const ejemplares = screen.getAllByRole('listitem')

    expect(within(ejemplares[0]).getByText(/CLENA-0001-1 · Disponible/)).toBeDefined()
    expect(within(ejemplares[1]).getByText(/CLENA-0001-2 · Prestado/)).toBeDefined()
  })

  it('ofrece el botón «Ver versión digital» cuando la obra la tiene', async () => {
    simularRespuesta(OBRA)
    pintar()

    const enlace = await screen.findByRole('link', { name: 'Ver versión digital' })

    expect(enlace.getAttribute('href')).toBe(OBRA.digitalUrl)
    expect(enlace.getAttribute('rel')).toContain('noopener')
  })

  it('no muestra el botón digital si la obra no tiene versión digital', async () => {
    simularRespuesta({ ...OBRA, digitalUrl: null })
    pintar()

    await screen.findByRole('heading', { name: 'Cien años de soledad' })

    expect(screen.queryByRole('link', { name: 'Ver versión digital' })).toBeNull()
  })

  it('explica que la obra no existe cuando la API responde 404', async () => {
    simularRespuesta(
      {
        statusCode: 404,
        error: 'Not Found',
        message: 'La obra no existe',
        path: `/api/v1/search/works/${ID}`,
      },
      404,
    )
    pintar()

    expect(await screen.findByRole('alert')).toBeDefined()
    expect(screen.getByText(/No encontramos esta obra en el catálogo/)).toBeDefined()
    expect(screen.getByRole('link', { name: 'Volver al catálogo' })).toBeDefined()
  })

  it('avisa del fallo de red sin confundirlo con una obra inexistente', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('offline'))))
    pintar()

    expect(
      await screen.findByText(/No pudimos conectarnos con el servidor/),
    ).toBeDefined()
  })
})
