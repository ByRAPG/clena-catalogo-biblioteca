import { describe, expect, it } from 'vitest'
import { leerSalaDeLaUrl } from './sala-url'

const ID = '5b0f7d4e-1c1e-5a53-a3f1-0d7f4a2c9e11'

describe('leerSalaDeLaUrl', () => {
  it('devuelve el id cuando es un UUID', () => {
    expect(leerSalaDeLaUrl(`?sala=${ID}`)).toBe(ID)
  })

  it('acepta URLSearchParams', () => {
    expect(leerSalaDeLaUrl(new URLSearchParams({ sala: ID }))).toBe(ID)
  })

  it('devuelve null si falta el parámetro', () => {
    expect(leerSalaDeLaUrl('')).toBeNull()
    expect(leerSalaDeLaUrl('?q=borges')).toBeNull()
  })

  it('devuelve null si no es un UUID', () => {
    expect(leerSalaDeLaUrl('?sala=abc')).toBeNull()
    expect(leerSalaDeLaUrl(`?sala=${ID}x`)).toBeNull()
    expect(leerSalaDeLaUrl('?sala=')).toBeNull()
  })
})
