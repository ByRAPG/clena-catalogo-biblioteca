import { describe, expect, it } from 'vitest'
import { decodificarBytesCsv } from './decodificar-csv'

describe('decodificarBytesCsv', () => {
  it('decodifica UTF-8 sin BOM', () => {
    const bytes = new TextEncoder().encode('Título,Autor\nAño,García')
    expect(decodificarBytesCsv(bytes)).toBe('Título,Autor\nAño,García')
  })

  it('decodifica UTF-8 con BOM eliminando la marca inicial', () => {
    const cuerpo = new TextEncoder().encode('titulo,autor\nCrónica,Peña')
    const conBom = new Uint8Array([0xef, 0xbb, 0xbf, ...cuerpo])
    expect(decodificarBytesCsv(conBom)).toBe('titulo,autor\nCrónica,Peña')
  })

  it('detecta y decodifica Windows-1252 con tildes y ñ', () => {
    // "Título;Año;Peña" en Windows-1252: í=0xED, ñ=0xF1
    const win1252 = new Uint8Array([
      0x54, 0xed, 0x74, 0x75, 0x6c, 0x6f, 0x3b, 0x41, 0xf1, 0x6f, 0x3b, 0x50,
      0x65, 0xf1, 0x61,
    ])
    expect(decodificarBytesCsv(win1252)).toBe('Título;Año;Peña')
  })
})
