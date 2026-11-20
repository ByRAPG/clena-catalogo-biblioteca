import { useEffect, useState } from 'react'

export const MS_POR_LETRA_ESCRIBIR = 55
export const MS_POR_LETRA_BORRAR = 30
export const MS_PAUSA = 1200

/** Largo del comienzo que comparten dos frases. */
export function prefijoComun(a: string, b: string): number {
  let n = 0
  while (n < a.length && n < b.length && a[n] === b[n]) n++
  return n
}

/**
 * Texto que se escribe y se borra letra por letra (efecto de máquina de
 * escribir) recorriendo `frases` en bucle. Una sola cadena de `setTimeout`,
 * que se limpia al desmontar o al desactivar, y que se detiene mientras la
 * pestaña está oculta. Con `activo` en false no hay temporizadores.
 */
export function usePlaceholderAnimado(frases: readonly string[], activo = true): string {
  const [texto, setTexto] = useState('')

  useEffect(() => {
    if (!activo || frases.length === 0) return
    let frase = 0
    let largo = 0
    let fase: 'escribe' | 'pausa' | 'borra' = 'escribe'
    let objetivoBorrado = 0
    let temporizador = 0
    let detenido = false

    // Avanza un paso y devuelve los ms que faltan para el siguiente.
    const paso = (): number => {
      const actual = frases[frase]
      if (fase === 'escribe') {
        largo += 1
        setTexto(actual.slice(0, largo))
        if (largo < actual.length) return MS_POR_LETRA_ESCRIBIR
        fase = 'pausa'
        return MS_PAUSA
      }
      if (fase === 'pausa') {
        const siguiente = frases[(frase + 1) % frases.length]
        objetivoBorrado = prefijoComun(actual, siguiente)
        fase = 'borra'
      }
      if (largo > objetivoBorrado) {
        largo -= 1
        setTexto(actual.slice(0, largo))
        return MS_POR_LETRA_BORRAR
      }
      frase = (frase + 1) % frases.length
      fase = 'escribe'
      return MS_POR_LETRA_ESCRIBIR
    }

    const tic = () => {
      if (document.hidden) {
        detenido = true
        return
      }
      temporizador = window.setTimeout(tic, paso())
    }
    const alCambiarVisibilidad = () => {
      if (detenido && !document.hidden) {
        detenido = false
        tic()
      }
    }

    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    temporizador = window.setTimeout(tic, MS_POR_LETRA_ESCRIBIR)
    return () => {
      window.clearTimeout(temporizador)
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
    }
  }, [frases, activo])

  return texto
}
