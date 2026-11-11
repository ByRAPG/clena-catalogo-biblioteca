import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { theme } from '../../shared/theme/theme'
import { PASOS_TUTORIAL } from './pasos'
import { TutorialBusqueda } from './tutorial-busqueda'
import { CLAVE_TUTORIAL_VISTO, tutorialYaVisto } from './tutorial-visto'

function pintar() {
  return render(
    <MantineProvider theme={theme} env="test" defaultColorScheme="light">
      <TutorialBusqueda />
    </MantineProvider>,
  )
}

const hayRecorrido = () => screen.queryByText(/Paso \d de \d/) !== null

describe('TutorialBusqueda', () => {
  beforeEach(() => localStorage.clear())

  it('tiene como máximo 4 pasos', () => {
    expect(PASOS_TUTORIAL.length).toBeGreaterThan(0)
    expect(PASOS_TUTORIAL.length).toBeLessThanOrEqual(4)
  })

  it('aparece en la primera visita', () => {
    pintar()
    expect(screen.getByText('Paso 1 de 4')).toBeDefined()
    expect(screen.getByRole('dialog')).toBeDefined()
  })

  it('«Saltar» lo marca como visto y no reaparece al volver a montar', () => {
    const primera = pintar()
    fireEvent.click(screen.getByRole('button', { name: 'Saltar' }))
    expect(tutorialYaVisto()).toBe(true)
    expect(hayRecorrido()).toBe(false)
    primera.unmount()

    pintar()
    expect(hayRecorrido()).toBe(false)
  })

  it('«Terminar» en el último paso lo marca como visto', () => {
    const primera = pintar()
    for (let i = 1; i < PASOS_TUTORIAL.length; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    }
    expect(screen.getByText('Paso 4 de 4')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Terminar' }))
    expect(localStorage.getItem(CLAVE_TUTORIAL_VISTO)).toBe('true')
    primera.unmount()

    pintar()
    expect(hayRecorrido()).toBe(false)
  })

  it('«¿Cómo buscar?» lo reabre desde el primer paso', () => {
    localStorage.setItem(CLAVE_TUTORIAL_VISTO, 'true')
    pintar()
    expect(hayRecorrido()).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: '¿Cómo buscar?' }))
    expect(screen.getByText('Paso 1 de 4')).toBeDefined()
  })

  it('avanza y retrocede con los botones y Escape lo cierra', () => {
    pintar()
    const siguiente = screen.getByRole('button', { name: 'Siguiente' })
    siguiente.focus()
    fireEvent.keyDown(siguiente, { key: 'Enter' })
    fireEvent.click(siguiente) // el navegador convierte Enter en clic
    expect(screen.getByText('Paso 2 de 4')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(screen.getByText('Paso 1 de 4')).toBeDefined()

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(hayRecorrido()).toBe(false)
    expect(tutorialYaVisto()).toBe(true)
  })

  it('«Anterior» está deshabilitado en el primer paso', () => {
    pintar()
    const anterior = screen.getByRole('button', {
      name: 'Anterior',
    }) as HTMLButtonElement
    expect(anterior.disabled).toBe(true)
  })
})
