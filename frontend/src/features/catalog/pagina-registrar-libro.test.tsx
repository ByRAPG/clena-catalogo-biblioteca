import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { Rutas } from '../../app/rutas'
import { theme } from '../../shared/theme/theme'
import { olvidarRenovacionCompartida } from '../auth/renovacion-compartida'
import { SesionProvider } from '../auth/sesion-provider'

const CATEGORIA = {
  id: '7c1f8e2a-3b4d-4c5e-9f10-2a3b4c5d6e7f',
  name: 'Literatura',
}

beforeAll(() => {
  // jsdom no implementa scrollIntoView y el desplegable de Mantine lo usa.
  Element.prototype.scrollIntoView ??= vi.fn()
})

/**
 * Monta la pantalla con la sesión que devuelva `POST /auth/refresh`. Desde el
 * ADR-03 el token vive solo en memoria, así que se recupera con la cookie al
 * cargar la página; el resto de llamadas se delegan al mock de la prueba.
 */
async function pintar(rol: 'ADMIN' | 'STAFF' | 'READER' | null) {
  const previa = globalThis.fetch
  const delegar = vi.isMockFunction(previa) ? previa : null
  vi.stubGlobal(
    'fetch',
    vi.fn((entrada: string, opciones?: RequestInit) => {
      if (String(entrada).includes('/auth/refresh')) {
        if (rol === null)
          return Promise.resolve(
            new Response(
              JSON.stringify({ statusCode: 401, message: 'Sesión no válida' }),
              { status: 401, headers: { 'Content-Type': 'application/json' } },
            ),
          )
        return Promise.resolve(
          Response.json({
            accessToken: 'token-prueba',
            usuario: { nombre: 'Usuario ficticio', rol },
          }),
        )
      }
      if (delegar !== null) return delegar(entrada, opciones)
      return new Promise<Response>(() => {})
    }),
  )
  render(
    <MantineProvider theme={theme}>
      <SesionProvider>
        <MemoryRouter initialEntries={['/gestion/registrar-libro']}>
          <Rutas />
        </MemoryRouter>
      </SesionProvider>
    </MantineProvider>,
  )
  await screen.findByRole(rol === 'READER' ? 'heading' : 'button', {
    name: rol === 'READER' ? 'No tiene permiso' : 'Guardar libro',
  })
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

// El desplegable del TagsInput también usa la etiqueta: solo el campo de texto.
const campo = (nombre: RegExp) =>
  screen.getByLabelText(nombre, { selector: 'input, textarea' })

/**
 * Escribe tecla por tecla, como un usuario. El TagsInput de Mantine no
 * reacciona a un evento `change` o `input` sintético suelto. Sin pausa entre
 * teclas (`delay: null`) para que la suite completa no se pase de tiempo.
 */
const usuario = () => userEvent.setup({ delay: null })

const escribir = async (nombre: RegExp, valor: string) => {
  await usuario().type(campo(nombre), valor)
}

const guardar = () =>
  usuario().click(screen.getByRole('button', { name: 'Guardar libro' }))

/** Margen para los tests que escriben varios campos (el CI es más lento). */
const LARGO = 15000
const ESPERA = { timeout: 5000 }

const llamadasA = (fetchMock: ReturnType<typeof apiFalsa>, ruta: string) =>
  fetchMock.mock.calls.filter(([url]) => String(url).includes(ruta))

beforeEach(() => {
  olvidarRenovacionCompartida()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Registrar un libro (HU-10)', () => {
  it('muestra el error junto al título y al autor y no guarda', async () => {
    const fetchMock = apiFalsa(() => json({ id: 'x', title: 'x' }, 201))
    vi.stubGlobal('fetch', fetchMock)
    await pintar('STAFF')

    await guardar()

    expect(await screen.findByText('Escriba el título del libro')).toBeDefined()
    expect(screen.getByText('Escriba al menos un autor')).toBeDefined()
    expect(campo(/^Título/).getAttribute('aria-invalid')).toBe('true')
    expect(llamadasA(fetchMock, '/catalog/works')).toHaveLength(0)
  })

  it('rechaza un año que no es número', async () => {
    vi.stubGlobal('fetch', apiFalsa(() => json({ id: 'x', title: 'x' }, 201)))
    await pintar('STAFF')
    await escribir(/^Título/, 'Libro ficticio')
    await escribir(/^Autores/, 'Autora Ficticia')
    await escribir(/^Año/, 'abc')

    await guardar()

    expect(
      await screen.findByText(/Escriba un año entre 1 y/, {}, ESPERA),
    ).toBeDefined()
  }, LARGO)

  it('envía el libro con el token y muestra «Libro registrado»', async () => {
    const fetchMock = apiFalsa(() =>
      json({ id: 'obra-1', title: 'Libro ficticio' }, 201),
    )
    vi.stubGlobal('fetch', fetchMock)
    await pintar('STAFF')
    await escribir(/^Título/, 'Libro ficticio')
    await escribir(/^Autores/, 'Autora Ficticia')
    await escribir(/^Temas/, 'Tema ficticio')
    await escribir(/^Año/, '2024')

    await guardar()

    expect(
      await screen.findByText('Libro registrado', {}, ESPERA),
    ).toBeDefined()
    expect(
      screen
        .getByRole('link', { name: 'Ver la ficha del libro' })
        .getAttribute('href'),
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
  }, LARGO)

  it('cuenta el autor escrito aunque no se presione Enter', async () => {
    const fetchMock = apiFalsa(() =>
      json({ id: 'obra-2', title: 'Otro libro' }, 201),
    )
    vi.stubGlobal('fetch', fetchMock)
    await pintar('STAFF')
    await escribir(/^Título/, 'Otro libro')
    // El último campo escrito es Autores: al guardar sigue sin convertirse en etiqueta.
    await escribir(/^Autores/, 'Autora Ficticia')

    await guardar()

    expect(
      await screen.findByText('Libro registrado', {}, ESPERA),
    ).toBeDefined()
    const [[, opciones]] = llamadasA(fetchMock, '/catalog/works')
    expect(JSON.parse(String(opciones?.body)).authors).toEqual([
      'Autora Ficticia',
    ])
  }, LARGO)

  it('muestra el mensaje del servidor si no se pudo guardar', async () => {
    vi.stubGlobal(
      'fetch',
      apiFalsa(() =>
        json({ statusCode: 400, message: 'La categoría no existe' }, 400),
      ),
    )
    await pintar('ADMIN')
    await escribir(/^Título/, 'Libro ficticio')
    await escribir(/^Autores/, 'Autora Ficticia')

    await guardar()

    expect(
      await screen.findByText('La categoría no existe', {}, ESPERA),
    ).toBeDefined()
    expect(screen.queryByText('Libro registrado')).toBeNull()
  }, LARGO)

  it('consulta los autores existentes mientras se escribe', async () => {
    const fetchMock = apiFalsa(() => json({ id: 'x', title: 'x' }, 201))
    vi.stubGlobal('fetch', fetchMock)
    await pintar('STAFF')

    await escribir(/^Autores/, 'garc')

    await waitFor(
      () =>
        expect(llamadasA(fetchMock, '/catalog/authors?q=garc')).toHaveLength(1),
      { timeout: 2000 },
    )
    const [[, opciones]] = llamadasA(fetchMock, '/catalog/authors')
    expect(new Headers(opciones?.headers).get('Authorization')).toBe(
      'Bearer token-prueba',
    )
    expect(
      await screen.findByText('Gabriel García Márquez', {}, { timeout: 2000 }),
    ).toBeDefined()
  }, LARGO)

  it('impide entrar a un lector', async () => {
    vi.stubGlobal('fetch', apiFalsa(() => json({})))
    await pintar('READER')
    expect(screen.getByRole('heading', { name: 'No tiene permiso' })).toBeDefined()
  })
})