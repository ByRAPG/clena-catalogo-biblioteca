import { describe, expect, it } from 'vitest'
import {
  textoDeLaCoincidencia,
  textoDelEstadoDeEjemplar,
  textoDelMotivo,
} from './textos'

describe('textoDelMotivo', () => {
  it('traduce cada motivo de no disponibilidad', () => {
    expect(textoDelMotivo('PRESTADO')).toBe('Prestado')
    expect(textoDelMotivo('MANTENIMIENTO')).toBe('En mantenimiento')
    expect(textoDelMotivo('SIN_EJEMPLARES')).toBe('Sin ejemplares')
  })

  it('devuelve cadena vacía si no hay motivo', () => {
    expect(textoDelMotivo(null)).toBe('')
  })
})

describe('textoDelEstadoDeEjemplar', () => {
  it('traduce cada estado de ejemplar', () => {
    expect(textoDelEstadoDeEjemplar('DISPONIBLE')).toBe('Disponible')
    expect(textoDelEstadoDeEjemplar('PRESTADO')).toBe('Prestado')
    expect(textoDelEstadoDeEjemplar('MANTENIMIENTO')).toBe('En mantenimiento')
  })
})

describe('textoDeLaCoincidencia', () => {
  it('indica dónde coincidió el término', () => {
    expect(textoDeLaCoincidencia('title')).toBe('Coincide en el título')
    expect(textoDeLaCoincidencia('author')).toBe('Coincide en el autor')
    expect(textoDeLaCoincidencia('subject')).toBe('Coincide en el tema')
  })

  it('devuelve cadena vacía si no hubo coincidencia', () => {
    expect(textoDeLaCoincidencia(null)).toBe('')
  })
})
