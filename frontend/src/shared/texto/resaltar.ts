/**
 * Coincidencias de la consulta dentro de un texto, insensibles a tildes y
 * mayúsculas. Devuelve trozos consecutivos del texto original (nunca lo
 * altera): `termino` para una palabra suelta y `frase` cuando la consulta
 * completa, con varias palabras, aparece seguida.
 */
export interface Trozo {
  texto: string
  tipo: 'normal' | 'termino' | 'frase'
}

const MARCAS = /\p{M}/gu

function normalizarCaracter(caracter: string): string {
  return caracter.normalize('NFD').replace(MARCAS, '').toLowerCase()
}

/** Normaliza y recuerda a qué carácter original pertenece cada carácter. */
function normalizar(texto: string): { norm: string; origen: number[] } {
  let norm = ''
  const origen: number[] = []
  let i = 0
  for (const caracter of texto) {
    const parte = normalizarCaracter(caracter)
    for (let k = 0; k < parte.length; k++) origen.push(i)
    norm += parte
    i += caracter.length
  }
  return { norm, origen }
}

export function terminosDeLaConsulta(consulta: string): string[] {
  const vistos = new Set<string>()
  for (const palabra of normalizar(consulta).norm.split(/\s+/)) {
    if (palabra.length >= 2) vistos.add(palabra)
  }
  return [...vistos]
}

export function trocear(texto: string, consulta: string): Trozo[] {
  const terminos = terminosDeLaConsulta(consulta)
  if (texto === '' || terminos.length === 0) return [{ texto, tipo: 'normal' }]

  const { norm, origen } = normalizar(texto)
  const nivelNorm = new Array<number>(norm.length).fill(0)

  function marcar(buscado: string, nivel: number) {
    let desde = norm.indexOf(buscado)
    while (desde !== -1) {
      for (let k = desde; k < desde + buscado.length; k++) {
        nivelNorm[k] = Math.max(nivelNorm[k], nivel)
      }
      desde = norm.indexOf(buscado, desde + buscado.length)
    }
  }

  for (const termino of terminos) marcar(termino, 1)
  if (terminos.length > 1) {
    marcar(normalizar(consulta).norm.trim().replace(/\s+/g, ' '), 2)
  }

  // Nivel por carácter original (el máximo de sus caracteres normalizados).
  const nivelOriginal = new Map<number, number>()
  origen.forEach((o, k) => {
    nivelOriginal.set(o, Math.max(nivelOriginal.get(o) ?? 0, nivelNorm[k]))
  })

  const trozos: Trozo[] = []
  let i = 0
  for (const caracter of texto) {
    const nivel = nivelOriginal.get(i) ?? 0
    const tipo = nivel === 2 ? 'frase' : nivel === 1 ? 'termino' : 'normal'
    const ultimo = trozos[trozos.length - 1]
    if (ultimo && ultimo.tipo === tipo) ultimo.texto += caracter
    else trozos.push({ texto: caracter, tipo })
    i += caracter.length
  }
  return trozos
}
