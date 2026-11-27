import { MantineProvider } from '@mantine/core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '../../shared/theme/theme'
import { CampoBusqueda } from './campo-busqueda'
import { PLACEHOLDER_BUSCADOR } from './textos'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function pintar(valor = '') {
  return render(
    <MantineProvider theme={theme}>
      <CampoBusqueda valorInicial={valor} />
    </MantineProvider>,
  )
}

describe('CampoBusqueda', () => {
  it('conserva la etiqueta real y un marcador estático', () => {
    pintar()
    const campo = screen.getByLabelText('Busque por título, autor o tema')
    expect(campo.getAttribute('placeholder')).toBe(PLACEHOLDER_BUSCADOR)
  })

  it('muestra el texto animado (decorativo) y lo oculta al enfocar o escribir', () => {
    const { container } = pintar()
    act(() => {
      vi.advanceTimersByTime(55 * 4)
    })
    const escritura = container.querySelector('.campo-busqueda-escritura')
    expect(escritura).not.toBeNull()
    expect(escritura?.getAttribute('aria-hidden')).toBe('true')
    expect(escritura?.textContent).toBe('¿Qué')

    const campo = screen.getByLabelText('Busque por título, autor o tema')
    fireEvent.focus(campo)
    expect(container.querySelector('.campo-busqueda-escritura')).toBeNull()

    fireEvent.input(campo, { target: { value: 'mar' } })
    fireEvent.blur(campo)
    expect(container.querySelector('.campo-busqueda-escritura')).toBeNull()

    fireEvent.input(campo, { target: { value: '' } })
    expect(container.querySelector('.campo-busqueda-escritura')).not.toBeNull()
  })

  it('no anima si la búsqueda ya tiene texto', () => {
    const { container } = pintar('mar')
    expect(container.querySelector('.campo-busqueda-escritura')).toBeNull()
  })

  it('marca el campo con data-animando mientras se anima (de ahí cuelga el CSS que oculta el marcador, también en alto contraste)', () => {
    pintar()
    const campo = screen.getByLabelText('Busque por título, autor o tema')
    expect(campo.getAttribute('data-animando')).toBe('true')
    fireEvent.focus(campo)
    expect(campo.getAttribute('data-animando')).toBe('false')
  })

  describe('búsqueda por voz', () => {
    afterEach(() => {
      delete (window as unknown as Record<string, unknown>)
        .webkitSpeechRecognition
    })

    it('no muestra el botón si el navegador no tiene reconocimiento de voz', () => {
      pintar()
      expect(screen.queryByRole('button', { name: 'Buscar por voz' })).toBeNull()
    })

    it('con soporte, el resultado llena la caja y envía la búsqueda', () => {
      class FalsoVoz {
        static ultima: FalsoVoz | null = null
        lang = ''
        interimResults = true
        maxAlternatives = 0
        onresult: (e: unknown) => void = () => {}
        onerror: (e: { error: string }) => void = () => {}
        onend: () => void = () => {}
        constructor() {
          FalsoVoz.ultima = this
        }
        start() {}
        stop() {}
      }
      ;(window as unknown as Record<string, unknown>).webkitSpeechRecognition =
        FalsoVoz
      const alEnviar = vi.fn()
      const { container } = render(
        <MantineProvider theme={theme}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              alEnviar()
            }}
          >
            <CampoBusqueda valorInicial="" />
          </form>
        </MantineProvider>,
      )
      const boton = screen.getByRole('button', { name: 'Buscar por voz' })
      fireEvent.click(boton)
      expect(boton.getAttribute('aria-pressed')).toBe('true')
      expect(screen.getByRole('status').textContent).toBe('Escuchando…')
      const voz = FalsoVoz.ultima
      if (voz === null) throw new Error('No se creó el reconocimiento')
      expect(voz.lang).toBe('es-CO')
      expect(voz.interimResults).toBe(false)
      expect(voz.maxAlternatives).toBe(1)
      act(() => {
        voz.onresult({ results: [[{ transcript: 'cien años de soledad' }]] })
      })
      const campo = container.querySelector(
        'input[name="q"]',
      ) as HTMLInputElement
      expect(campo.value).toBe('cien años de soledad')
      expect(alEnviar).toHaveBeenCalledTimes(1)
    })

    it('explica los errores de voz sin bloquear la búsqueda escrita', () => {
      class FalsoVoz {
        static ultima: FalsoVoz | null = null
        onerror: (e: { error: string }) => void = () => {}
        constructor() {
          FalsoVoz.ultima = this
        }
        start() {}
      }
      ;(window as unknown as Record<string, unknown>).webkitSpeechRecognition =
        FalsoVoz
      pintar()
      fireEvent.click(screen.getByRole('button', { name: 'Buscar por voz' }))
      const voz = FalsoVoz.ultima
      if (voz === null) throw new Error('No se creó el reconocimiento')
      act(() => voz.onerror({ error: 'not-allowed' }))
      expect(screen.getByRole('status').textContent).toContain('micrófono')
      expect(
        screen
          .getByLabelText('Busque por título, autor o tema')
          .hasAttribute('disabled'),
      ).toBe(false)
    })
  })
})
