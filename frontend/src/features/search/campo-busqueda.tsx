import { TextInput } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useState } from 'react'
import { GUION_BUSCADOR, PLACEHOLDER_BUSCADOR } from './textos'
import { usePlaceholderAnimado } from './use-placeholder-animado'
import './campo-busqueda.css'

/**
 * Campo de búsqueda con un mini tutorial dentro: un texto que se escribe y se
 * borra solo mostrando las formas de buscar. El <input> conserva su etiqueta y
 * un marcador estático corto; el texto animado es decorativo (`aria-hidden`),
 * desaparece al enfocar o al escribir y vuelve si el campo queda vacío y sin
 * foco. Con movimiento reducido no se anima.
 */
export function CampoBusqueda({ valorInicial }: { valorInicial: string }) {
  const reducido = useMediaQuery('(prefers-reduced-motion: reduce)') === true
  const [enfocado, setEnfocado] = useState(false)
  const [vacio, setVacio] = useState(valorInicial === '')
  const animando = !reducido && !enfocado && vacio
  const texto = usePlaceholderAnimado(GUION_BUSCADOR, animando)

  return (
    <TextInput
      name="q"
      label="Busque por título, autor o tema"
      placeholder={PLACEHOLDER_BUSCADOR}
      defaultValue={valorInicial}
      maxLength={100}
      style={{ flex: '1 1 18rem' }}
      data-animando={animando}
      classNames={{ input: 'campo-busqueda-input' }}
      onFocus={() => setEnfocado(true)}
      onBlur={() => setEnfocado(false)}
      onInput={(evento) => setVacio(evento.currentTarget.value === '')}
      inputContainer={(entrada) => (
        <div className="campo-busqueda-caja">
          {entrada}
          {animando && (
            <span className="campo-busqueda-escritura" aria-hidden="true">
              <span className="campo-busqueda-texto">{texto}</span>
              <span className="campo-busqueda-cursor" />
            </span>
          )}
        </div>
      )}
    />
  )
}
