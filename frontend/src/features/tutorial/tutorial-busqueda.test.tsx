import { MantineProvider } from '@mantine/core'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '../../shared/theme/theme'
import {
  EVENTO_CABECERA_MENU,
  EVENTO_INTRO_TERMINADA,
  PASOS_TUTORIAL,
  pasosParaDispositivo,
  textoDelPaso,
} from './pasos'
import { TutorialBusqueda } from './tutorial-busqueda'
import {
  CLAVE_INTRO_VISTA,
  CLAVE_TUTORIAL_VISTO,
  tutorialYaVisto,
} from './tutorial-visto'

function pintar() {
  return render(
    <MantineProvider theme={theme} env="test" defaultColorScheme="light">
      <button type="button">Fuera</button>
      <div data-tutorial="buscador">buscador</div>
      <TutorialBusqueda />
    </MantineProvider>,
  )
}

const hayRecorrido = () => screen.queryByRole('dialog') !== null
const siguiente = () => fireEvent.click(screen.getByRole('button', { name: /Siguiente|Empezar/ }))

describe('pasos', () => {
  it('tiene como máximo 7 pasos con id único', () => {
    expect(PASOS_TUTORIAL.length).toBeLessThanOrEqual(7)
    expect(new Set(PASOS_TUTORIAL.map((p) => p.id)).size).toBe(PASOS_TUTORIAL.length)
  })

  it('filtra los pasos por dispositivo', () => {
    const pc = pasosParaDispositivo('computador').map((p) => p.id)
    const cel = pasosParaDispositivo('celular').map((p) => p.id)
    expect(pc).not.toContain('qr')
    expect(cel).toContain('qr')
    expect(cel.length).toBe(pc.length + 1)
  })

  it('elige el texto según el dispositivo', () => {
    const buscar = PASOS_TUTORIAL[0]
    expect(textoDelPaso(buscar, 'computador')).toMatch(/Enter|clic/)
    expect(textoDelPaso(buscar, 'celular')).toMatch(/Toque/)
  })
})

describe('TutorialBusqueda', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.stubEnv('VITE_INTRO_CINEMATICA', 'false')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('el paso de accesibilidad abre el menú de la cabecera y lo cierra al salir, omitir o cerrar', () => {
    const paso = PASOS_TUTORIAL.find((p) => p.id === 'accesibilidad')
    expect(paso?.abreMenu).toBe(true)
    expect(textoDelPaso(paso!, 'celular')).toMatch(/Gestión.*Ingresar/)

    const pedidos: boolean[] = []
    const alPedir = (e: Event) => pedidos.push((e as CustomEvent<{ abierto: boolean }>).detail.abierto)
    window.addEventListener(EVENTO_CABECERA_MENU, alPedir)
    const ids = pasosParaDispositivo('celular').map((p) => p.id)
    const hasta = ids.indexOf('accesibilidad')

    pintar()
    for (let i = 0; i <= hasta; i++) siguiente() // portada + pasos hasta el de accesibilidad
    expect(screen.getByText(/Ajuste la pantalla/)).toBeDefined()
    expect(pedidos).toEqual([true])
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(pedidos).toEqual([true, false])

    siguiente()
    expect(pedidos).toEqual([true, false, true])
    fireEvent.click(screen.getByRole('button', { name: 'Omitir' }))
    expect(pedidos).toEqual([true, false, true, false])
    window.removeEventListener(EVENTO_CABECERA_MENU, alPedir)
  })

  it('usa la clave v2', () => {
    expect(CLAVE_TUTORIAL_VISTO.endsWith('-v2')).toBe(true)
  })

  it('aparece en la primera visita con portada y luego el paso 1', () => {
    pintar()
    expect(screen.getByRole('dialog')).toBeDefined()
    siguiente()
    expect(screen.getByText(`Paso 1 de ${pasosParaDispositivo('computador').length}`)).toBeDefined()
  })

  it('un paso sin elemento en pantalla muestra su contenido sin fallar', () => {
    pintar() // no existe data-tutorial="primer-resultado"
    siguiente()
    siguiente()
    expect(screen.getByText(/Entienda por qué aparece/)).toBeDefined()
    expect(document.querySelector('.tutorial-foco')?.getAttribute('data-visible')).toBe('false')
  })

  it('el paso «Entienda por qué aparece» ilustra la coincidencia sin depender de una búsqueda', () => {
    const paso = PASOS_TUTORIAL.find((p) => p.id === 'coincidencia')
    expect(paso?.completo).toBe(true)
    expect(paso?.muestras?.length).toBe(2)
    pintar() // sin resultados en pantalla
    siguiente()
    siguiente()
    const muestras = document.querySelector('.tutorial-muestras')
    expect(muestras?.getAttribute('aria-hidden')).toBe('true')
    expect(muestras?.querySelector('.coincidencia-campo')?.textContent).toBe('el título')
    expect(muestras?.querySelector('.insignia-significado')?.textContent).toBe(
      'Relacionado por tema',
    )
    expect(screen.getByText(/Ejemplo ilustrativo\. Si busca «mar»/)).toBeDefined()
  })

  it('«Omitir» lo marca como visto y no reaparece al volver a montar', () => {
    const primera = pintar()
    fireEvent.click(screen.getByRole('button', { name: 'Omitir' }))
    expect(tutorialYaVisto()).toBe(true)
    expect(hayRecorrido()).toBe(false)
    primera.unmount()
    pintar()
    expect(hayRecorrido()).toBe(false)
  })

  it('«Terminar» en el último paso lo marca como visto', () => {
    pintar()
    const n = pasosParaDispositivo('computador').length
    for (let i = 0; i < n; i++) siguiente()
    fireEvent.click(screen.getByRole('button', { name: 'Terminar' }))
    expect(localStorage.getItem(CLAVE_TUTORIAL_VISTO)).toBe('true')
  })

  it('«¿Cómo buscar?» lo reabre desde la portada', () => {
    localStorage.setItem(CLAVE_TUTORIAL_VISTO, 'true')
    pintar()
    expect(hayRecorrido()).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: '¿Cómo buscar?' }))
    expect(screen.getByRole('button', { name: 'Empezar' })).toBeDefined()
  })

  it('al reabrir, la bienvenida va centrada y el paso se ancla junto al objetivo', async () => {
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 300,
      width: 200,
      height: 40,
      right: 500,
      bottom: 140,
      x: 300,
      y: 100,
      toJSON: () => ({}),
    })
    try {
      localStorage.setItem(CLAVE_TUTORIAL_VISTO, 'true')
      pintar()
      const abrir = () => fireEvent.click(screen.getByRole('button', { name: '¿Cómo buscar?' }))
      abrir()
      expect((screen.getByRole('dialog') as HTMLElement).dataset.modo).toBe('centro')
      siguiente()
      await waitFor(() => expect(screen.getByRole('dialog').dataset.lista).toBe('true'), {
        timeout: 3000,
      })
      expect(screen.getByRole('dialog').dataset.modo).not.toBe('centro')
      fireEvent.click(screen.getByRole('button', { name: 'Omitir' }))
      for (let i = 0; i < 3; i++) {
        abrir()
        const tarjeta = screen.getByRole('dialog') as HTMLElement
        expect(tarjeta.dataset.modo).toBe('centro')
        fireEvent.click(screen.getByRole('button', { name: 'Omitir' }))
      }
    } finally {
      rect.mockRestore()
    }
  })

  it('navega con las flechas y Escape lo cierra', () => {
    pintar()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText(/Paso 1 de/)).toBeDefined()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText(/Paso 2 de/)).toBeDefined()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText(/Paso 1 de/)).toBeDefined()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(hayRecorrido()).toBe(false)
    expect(tutorialYaVisto()).toBe(true)
  })

  it('devuelve el foco al elemento anterior al cerrar', () => {
    localStorage.setItem(CLAVE_TUTORIAL_VISTO, 'true')
    pintar()
    const fuera = screen.getByRole('button', { name: 'Fuera' })
    fuera.focus()
    act(() => {
      window.dispatchEvent(new Event('clena:abrir-tutorial'))
    })
    expect(document.activeElement).not.toBe(fuera)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.activeElement).toBe(fuera)
  })

  it('no hay «Anterior» en la portada pero sí desde el paso 1', () => {
    pintar()
    expect(screen.queryByRole('button', { name: 'Anterior' })).toBeNull()
    siguiente()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDefined()
  })

  it('con intro pendiente espera el evento de la intro', () => {
    vi.stubEnv('VITE_INTRO_CINEMATICA', 'true')
    expect(sessionStorage.getItem(CLAVE_INTRO_VISTA)).toBeNull()
    pintar()
    expect(hayRecorrido()).toBe(false)
    act(() => {
      window.dispatchEvent(new Event(EVENTO_INTRO_TERMINADA))
    })
    expect(hayRecorrido()).toBe(true)
  })

  it('con intro pendiente abre una sola vez: el aviso y el respaldo no reabren la bienvenida', () => {
    vi.useFakeTimers()
    try {
      vi.stubEnv('VITE_INTRO_CINEMATICA', 'true')
      pintar()
      act(() => {
        window.dispatchEvent(new Event(EVENTO_INTRO_TERMINADA))
      })
      expect(hayRecorrido()).toBe(true)
      siguiente()
      expect(screen.getByText(/Paso 1 de/)).toBeDefined()
      // Ni el segundo aviso ni el respaldo devuelven a la bienvenida.
      act(() => {
        window.dispatchEvent(new Event(EVENTO_INTRO_TERMINADA))
        vi.advanceTimersByTime(20000)
      })
      expect(screen.getByText(/Paso 1 de/)).toBeDefined()
    } finally {
      vi.useRealTimers()
    }
  })

  it('usa un solo velo y no lo vuelve a montar al cambiar de paso', () => {
    pintar()
    const velo = document.querySelector('.tutorial-velo')
    expect(document.querySelectorAll('.tutorial-velo')).toHaveLength(1)
    siguiente()
    siguiente()
    expect(document.querySelectorAll('.tutorial-velo')).toHaveLength(1)
    expect(document.querySelector('.tutorial-velo')).toBe(velo)
  })
})
