import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ESQUEMA_LOGO } from './logo-concepto'
import { LogoMarca, LogosCabecera } from './marca'

function pintar() {
  return render(
    <MemoryRouter>
      <LogosCabecera />
    </MemoryRouter>,
  )
}

describe('LogosCabecera', () => {
  it('muestra los cuatro logos en orden y los externos como enlaces seguros', () => {
    const { container } = pintar()
    const enlaces = Array.from(container.querySelectorAll('a'))
    expect(enlaces.map((a) => a.getAttribute('href'))).toEqual([
      'https://www.uninorte.edu.co/',
      'https://clena.org/',
      'https://www.bibliotecapilotodelcaribe.com/',
      '/',
    ])
    for (const a of enlaces.slice(0, 3)) {
      expect(a.getAttribute('target')).toBe('_blank')
      expect(a.getAttribute('rel')).toBe('noopener noreferrer')
    }
    expect(
      screen.getByRole('link', { name: 'Universidad del Norte, se abre en una pestaña nueva' }),
    ).toBeDefined()
    expect(
      screen.getByRole('link', { name: 'Corporación CLENA, se abre en una pestaña nueva' }),
    ).toBeDefined()
    expect(
      screen.getByRole('link', {
        name: 'Biblioteca Piloto del Caribe, se abre en una pestaña nueva',
      }),
    ).toBeDefined()
    expect(screen.getByRole('link', { name: /Busca Fácil.*inicio/ })).toBeDefined()
  })

  it('usa Uninorte blanco sin placa, el CLENA amarillo y reserva el tamaño de cada imagen', () => {
    pintar()
    const uninorte = screen.getByAltText('Universidad del Norte')
    expect(uninorte.getAttribute('src')).toBe('/intro/uninorte-blanco.png')
    expect(uninorte.classList.contains('logo-placa')).toBe(false)
    expect(screen.getByAltText('Corporación CLENA').getAttribute('src')).toBe(
      '/intro/clena-amarillo.svg',
    )
    for (const alt of ['Universidad del Norte', 'Corporación CLENA', 'Biblioteca Piloto del Caribe']) {
      const img = screen.getByAltText(alt)
      expect(Number(img.getAttribute('width'))).toBeGreaterThan(0)
      expect(Number(img.getAttribute('height'))).toBeGreaterThan(0)
    }
  })

  it('si falta un logo desaparece su enlace sin dejar imagen rota; el BF no depende de archivos', () => {
    pintar()
    for (const alt of ['Universidad del Norte', 'Corporación CLENA', 'Biblioteca Piloto del Caribe']) {
      fireEvent.error(screen.getByAltText(alt))
      expect(screen.queryByAltText(alt)).toBeNull()
    }
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link', { name: /Busca Fácil.*inicio/ })).toBeDefined()
  })
})

describe('LogoMarca', () => {
  it('el logotipo horizontal es decorativo por defecto, sin texto de fuente, con tamaño reservado', () => {
    const { container } = render(<LogoMarca variante="claro" size={27} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.querySelector('text')).toBeNull()
    expect(svg?.getAttribute('viewBox')).toBe('-6 -5 202 50')
    expect(svg?.getAttribute('height')).toBe('27')
    expect(Number(svg?.getAttribute('width'))).toBeGreaterThan(100)
  })

  it('con título se anuncia con su nombre y tiene variante oscura', () => {
    render(<LogoMarca titulo="Busca Fácil" variante="oscuro" />)
    const img = screen.getByRole('img', { name: 'Busca Fácil' })
    expect(img.getAttribute('data-variante')).toBe('oscuro')
    expect(img.querySelector('.logo-texto')).not.toBeNull()
  })

  it('la versión compacta es el «BF»: solo la B y la F, sin lupa, con tamaño reservado', () => {
    const { container } = render(<LogoMarca forma="simbolo" variante="claro" size={38} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('viewBox')).toBe('-2.5 -3 56 40')
    expect(svg?.getAttribute('height')).toBe('38')
    expect(Number(svg?.getAttribute('width'))).toBeGreaterThan(40)
    expect(svg?.querySelector('.logo-lupa')).toBeNull()
    expect(svg?.querySelectorAll('.logo-texto')).toHaveLength(1)
  })

  it('el esquema de color se fija en <html> con la constante', async () => {
    const { aplicarEsquemaLogo } = await import('./logo-esquema')
    aplicarEsquemaLogo()
    expect(document.documentElement.dataset.logo).toBe(String(ESQUEMA_LOGO))
  })
})
