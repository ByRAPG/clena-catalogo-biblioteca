import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { theme } from '../../shared/theme/theme'
import { AccesibilidadProvider } from './accesibilidad-provider'
import { ControlesAccesibilidad } from './controles-accesibilidad'

function pintar() {
  return render(
    <MantineProvider theme={theme} defaultColorScheme="light">
      <AccesibilidadProvider>
        <ControlesAccesibilidad />
      </AccesibilidadProvider>
    </MantineProvider>,
  )
}

const raiz = document.documentElement

describe('ControlesAccesibilidad', () => {
  beforeEach(() => {
    localStorage.clear()
    raiz.removeAttribute('data-letra-grande')
    raiz.removeAttribute('data-alto-contraste')
  })

  it('arranca con ambos botones sin presionar', () => {
    pintar()
    for (const nombre of ['Letra más grande', 'Alto contraste']) {
      const boton = screen.getByRole('button', { name: nombre })
      expect(boton.getAttribute('aria-pressed')).toBe('false')
    }
    expect(raiz.getAttribute('data-letra-grande')).toBe('false')
  })

  it('alterna «Letra más grande» y lo refleja en <html>', () => {
    pintar()
    const boton = screen.getByRole('button', { name: 'Letra más grande' })
    fireEvent.click(boton)
    expect(boton.getAttribute('aria-pressed')).toBe('true')
    expect(raiz.getAttribute('data-letra-grande')).toBe('true')
    fireEvent.click(boton)
    expect(boton.getAttribute('aria-pressed')).toBe('false')
    expect(raiz.getAttribute('data-letra-grande')).toBe('false')
  })

  it('alterna «Alto contraste» y lo refleja en <html>', () => {
    pintar()
    const boton = screen.getByRole('button', { name: 'Alto contraste' })
    fireEvent.click(boton)
    expect(boton.getAttribute('aria-pressed')).toBe('true')
    expect(raiz.getAttribute('data-alto-contraste')).toBe('true')
  })

  it('mantiene la preferencia al volver a montar (recarga)', () => {
    const primera = pintar()
    fireEvent.click(screen.getByRole('button', { name: 'Alto contraste' }))
    primera.unmount()
    raiz.removeAttribute('data-alto-contraste')

    pintar()
    const boton = screen.getByRole('button', { name: 'Alto contraste' })
    expect(boton.getAttribute('aria-pressed')).toBe('true')
    expect(raiz.getAttribute('data-alto-contraste')).toBe('true')
    expect(
      screen
        .getByRole('button', { name: 'Letra más grande' })
        .getAttribute('aria-pressed'),
    ).toBe('false')
  })
})
