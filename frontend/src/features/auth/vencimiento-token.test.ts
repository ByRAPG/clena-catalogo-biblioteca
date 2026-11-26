import { describe, expect, it } from 'vitest'
import {
  ESPERA_POR_DEFECTO_MS,
  MARGEN_MS,
  esperaHastaRenovar,
  venceEn,
} from './vencimiento-token'

/** JWT sin firma válida: solo importa la carga para leer `exp`. */
function jwtQueVence(expSegundos: number): string {
  const carga = btoa(JSON.stringify({ sub: 'u1', exp: expSegundos }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `cabecera.${carga}.firma`
}

describe('vencimiento del access token', () => {
  it('lee exp del JWT en milisegundos', () => {
    expect(venceEn(jwtQueVence(1_000))).toBe(1_000_000)
  })

  it('devuelve null si el token no es un JWT legible', () => {
    expect(venceEn('jwt-de-prueba')).toBeNull()
    expect(venceEn('a.%%%.c')).toBeNull()
    expect(venceEn(`a.${btoa('{"sub":"u1"}')}.c`)).toBeNull()
  })

  it('renueva un minuto antes de vencer', () => {
    const ahora = 1_000_000
    const token = jwtQueVence((ahora + 15 * 60_000) / 1000)
    expect(esperaHastaRenovar(token, ahora)).toBe(15 * 60_000 - MARGEN_MS)
  })

  it('con el token ya vencido espera poco, sin bucle inmediato', () => {
    expect(esperaHastaRenovar(jwtQueVence(1), 10_000_000)).toBe(5_000)
  })

  it('sin exp legible usa la espera por defecto', () => {
    expect(esperaHastaRenovar('jwt-de-prueba', 0)).toBe(ESPERA_POR_DEFECTO_MS)
  })
})
