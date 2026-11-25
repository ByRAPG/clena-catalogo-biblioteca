import { describe, expect, it } from 'vitest'
import { esUrlWeb } from './url-web'

describe('esUrlWeb', () => {
  it('acepta http y https', () => {
    expect(esUrlWeb('https://ejemplo.org/libro')).toBe(true)
    expect(esUrlWeb('http://ejemplo.org')).toBe(true)
  })
  it('rechaza otros protocolos, texto inválido y vacíos', () => {
    expect(esUrlWeb('javascript:alert(1)')).toBe(false)
    expect(esUrlWeb('data:text/html,x')).toBe(false)
    expect(esUrlWeb('no es url')).toBe(false)
    expect(esUrlWeb(null)).toBe(false)
    expect(esUrlWeb('')).toBe(false)
  })
})
