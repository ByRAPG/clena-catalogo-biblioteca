import { useEffect, useState } from 'react'
import { useDebouncedValue } from '@mantine/hooks'
import { sugerirTerminos, type TipoDeTermino } from './registrar-obra.api'

const LETRAS_MINIMAS = 2

/**
 * Pide al backend los autores o temas existentes que coinciden con lo que se
 * escribe, con una pausa de 300 ms para no consultar en cada tecla.
 */
export function useSugerencias(
  tipo: TipoDeTermino,
  texto: string,
  token: string | undefined,
): string[] {
  const [demorado] = useDebouncedValue(texto.trim(), 300)
  const [resultado, setResultado] = useState<{
    texto: string
    nombres: string[]
  }>({ texto: '', nombres: [] })

  useEffect(() => {
    if (!token || demorado.length < LETRAS_MINIMAS) return
    const control = new AbortController()
    sugerirTerminos(tipo, demorado, token, control.signal)
      .then((terminos) =>
        setResultado({ texto: demorado, nombres: terminos.map((t) => t.name) }),
      )
      // Sin sugerencias se puede seguir escribiendo el nombre completo.
      .catch(() => undefined)
    return () => control.abort()
  }, [tipo, demorado, token])

  return demorado.length >= LETRAS_MINIMAS && resultado.texto === demorado
    ? resultado.nombres
    : []
}
