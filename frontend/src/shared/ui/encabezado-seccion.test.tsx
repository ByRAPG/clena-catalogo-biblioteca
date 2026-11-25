import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { EncabezadoSeccion } from './encabezado-seccion'

describe('EncabezadoSeccion', () => {
  it('es una franja con foto, con migas, rótulo y título', () => {
    render(
      <MemoryRouter>
        <EncabezadoSeccion
          migas={[{ texto: 'Inicio', to: '/' }, { texto: 'Gestión' }]}
          rotulo="Personal"
          titulo="Gestión del catálogo"
          tono="granate"
        />
      </MemoryRouter>,
    )
    const titulo = screen.getByRole('heading', { name: 'Gestión del catálogo' })
    const franja = titulo.closest('header')
    expect(franja?.className).toContain('franja-granate')
    expect(franja?.className).toContain('encabezado-seccion')
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeDefined()
    expect(screen.getByText('Personal')).toBeDefined()
  })
})
