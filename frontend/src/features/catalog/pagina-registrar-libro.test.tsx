import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Rutas } from '../../app/rutas'
import { theme } from '../../shared/theme/theme'
import { SesionProvider } from '../auth/sesion-provider'

const CATEGORIA = {
  id: '7c1f8e2a-3b4d-4c5e-9f10-2a3b4c5d6e7f',
  name: 'Literatura',
}

function pintar(rol: 'ADMIN' | 'STAFF' | 'READER' | null) {
  sessionStorage.clear()
  if (rol)
    sessionStorage.setItem(
      'clena.sesion',
      JSON.stringify({ token: 'token-prueba', nombre: 'Usuario ficticio', rol }),
    )
  return render(
    <MantineProvider theme={theme}>
      <SesionProvider>
        <MemoryRouter initialEntries={['/gestion/registrar-libro']}>
          <Rutas />
        </MemoryRouter>
      </SesionProvider>
    </MantineProvider>,
  )
}

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status })

/** Responde según la ruta, como la API real. */
function apiFalsa(registro: () => Response) {
  return vi.fn((url: string, opciones?: RequestInit) => {
    if (url.includes('/search/categories'))
      return Promise.resolve(json({ data: [CATEGORIA] }))
    if (url.includes('/catalog/authors'))
      return Promise.resolve(
        json({ data: [{ id: 'a1', name: 'Gabriel García Márquez' }] }),
      )
    if (url.includes('/catalog/subjects'))
      return Promise.resolve(json({ data: [] }))
    if (url.includes('/catalog/works') && opciones?.method === 'POST')
      return Promise.resolve(registro())
    return Promise.reject(new Error(`Ruta no esperada: ${url}`))
  })
}

const campo = (nombre: RegExp) => screen.getByLabelText(nombre)
const escribir = (nombre: RegExp, valor: string) =>
  fireEvent.change(campo(nombre), { target: { value: valor } })
const llamadasA = (fetchMock: ReturnType<typeof apiFalsa>, ruta: string) =>
  fetchMock.mock.calls.filter(([url]) => String(url).includes(ruta))

afterEach(() => {
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

describe('Registrar un libro (HU-10)', () => {
  it('muestra el error junto al título y al autor y no guarda', async () => {
    const fetchMock = apiFalsa(() => json({ id: 'x', title: 'x' }, 201))
    vi.stubGlobal('fetch', fetchMock)
    pintar('STAFF')

    fireEvent.click(screen.getByRole('button', { name: 'Guardar libro' }))

    expect(await screen.findByText('Escriba el título del libro')).toBeDefined()
    expect(screen.getByText('Escriba al menos un autor')).toBeDefined()
    expect(campo(/^Título/).getAttribute('aria-invalid')).toBe('true')
    expect(llamadasA(fetchMock, '/catalog/works')).toHaveLength(0)
  })

  it('rechaza un año que no es número', async () => {
    vi.stubGlobal('fetch', apiFalsa(() => json({ id: 'x', title: 'x' }, 201)))
    pintar('STAFF')
    escribir(/^Título/, 'Libro ficticio')
    escribir(/^Autores/, 'Autora Ficticia')
    escribir(/^Año/, 'abc')

    fireEvent.click(screen.getByRole('button', { name: 'Guardar libro' }))

    expect(await screen.findByText(/Escriba un año entre 1 y/)).toBeDefined()
  })

  it('envía el libro con el token y muestra «Libro registrado»', async () => {
    const fetchMock = apiFalsa(() =>
      json({ id: 'obra-1', title: 'Libro ficticio' }, 201),
    )
    vi.stubGlobal('fetch', fetchMock)
    pintar('STAFF')
    escribir(/^Título/, '  Libro ficticio ')
    // Un autor escrito sin presionar Enter también cuenta.
    escribir(/^Autores/, 'Autora Ficticia')
    escribir(/^Temas/, 'Tema ficticio')
    escribir(/^Año/, '2024')

    fireEvent.click(screen.getByRole('button', { name: 'Guardar libro' }))

    expect(await screen.findByText('Libro registrado')).toBeDefined()
    expect(
      screen.getByRole('link', { name: 'Ver la ficha del libro' }).getAttribute('href'),
    ).toBe('/obras/obra-1')
    const [[, opciones]] = llamadasA(fetchMock, '/catalog/works')
    expect(new Headers(opciones?.headers).get('Authorization')).toBe(
      'Bearer token-prueba',
    )
    expect(JSON.parse(String(opciones?.body))).toEqual({
      title: 'Libro ficticio',
      authors: ['Autora Ficticia'],
      subjects: ['Tema ficticio'],
      year: 2024,
    })
    // El formulario queda listo para el siguiente libro.
    expect((campo(/^Título/) as HTMLInputElement).value).toBe('')
  })

  it('muestra el mensaje del servidor si no se pudo guardar', async () => {
    vi.stubGlobal(
      'fetch',
      apiFalsa(() =>
        json({ statusCode: 400, message: 'La categoría no existe' }, 400),
      ),
    )
    pintar('ADMIN')
    escribir(/^Título/, 'Libro ficticio')
    escribir(/^Autores/, 'Autora Ficticia')

    fireEvent.click(screen.getByRole('button', { name: 'Guardar libro' }))

    expect(await screen.findByText('La categoría no existe')).toBeDefined()
    expect(screen.queryByText('Libro registrado')).toBeNull()
  })

  it('consulta los autores existentes mientras se escribe', async () => {
    const fetchMock = apiFalsa(() => json({ id: 'x', title: 'x' }, 201))
    vi.stubGlobal('fetch', fetchMock)
    pintar('STAFF')

    escribir(/^Autores/, 'garc')

    await waitFor(() =>
      expect(llamadasA(fetchMock, '/catalog/authors?q=garc')).toHaveLength(1),
    )
    const [[, opciones]] = llamadasA(fetchMock, '/catalog/authors')
    expect(new Headers(opciones?.headers).get('Authorization')).toBe(
      'Bearer token-prueba',
    )
  })

  it('impide entrar a un lector', () => {
    vi.stubGlobal('fetch', apiFalsa(() => json({})))
    pintar('READER')
    expect(screen.getByRole('heading', { name: 'No tiene permiso' })).toBeDefined()
  })
})
