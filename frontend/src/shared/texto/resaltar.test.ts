import { describe, expect, it } from 'vitest'
import { terminosDeLaConsulta, trocear } from './resaltar'

describe('trocear', () => {
  it('resalta sin distinguir tildes ni mayúsculas', () => {
    expect(trocear('Cien años de soledad', 'ANOS')).toEqual([
      { texto: 'Cien ', tipo: 'normal' },
      { texto: 'años', tipo: 'termino' },
      { texto: ' de soledad', tipo: 'normal' },
    ])
  })

  it('distingue la frase exacta de los términos sueltos', () => {
    const trozos = trocear('El mar y la mar salada', 'mar salada')
    expect(trozos.filter((t) => t.tipo === 'frase').map((t) => t.texto)).toEqual(
      ['mar salada'],
    )
    expect(trozos.filter((t) => t.tipo === 'termino').length).toBe(1)
  })

  it('no altera el texto original', () => {
    const texto = 'Ñandú: ¿Qué hay?'
    expect(trocear(texto, 'que nandu').map((t) => t.texto).join('')).toBe(texto)
  })

  it('sin consulta devuelve el texto tal cual', () => {
    expect(trocear('Hola', '')).toEqual([{ texto: 'Hola', tipo: 'normal' }])
    expect(trocear('Hola', 'a')).toEqual([{ texto: 'Hola', tipo: 'normal' }])
  })

  it('ignora términos de un solo carácter', () => {
    expect(terminosDeLaConsulta('a mar  MAR')).toEqual(['mar'])
  })
})
