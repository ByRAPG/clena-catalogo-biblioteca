import { ActionIcon, TextInput, VisuallyHidden } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useRef, useState } from 'react'
import { IconoMicrofono } from '../../shared/ui/iconos'
import { GUION_BUSCADOR, PLACEHOLDER_BUSCADOR } from './textos'
import { usePlaceholderAnimado } from './use-placeholder-animado'
import './campo-busqueda.css'

interface ReconocimientoVoz {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult:
    | ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
    | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type ConstructorVoz = new () => ReconocimientoVoz

function constructorDeVoz(): ConstructorVoz | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: ConstructorVoz
    webkitSpeechRecognition?: ConstructorVoz
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const AYUDA_VOZ = 'El dictado lo procesa el servicio de voz de su navegador'

function mensajeDeErrorDeVoz(codigo: string): string {
  if (codigo === 'not-allowed' || codigo === 'service-not-allowed') {
    return 'No hay permiso para usar el micrófono. Puede escribir su búsqueda.'
  }
  if (codigo === 'no-speech') {
    return 'No se escuchó nada. Intente de nuevo o escriba su búsqueda.'
  }
  if (codigo === 'network') {
    return 'No hay conexión con el servicio de voz. Puede escribir su búsqueda.'
  }
  return 'No se pudo usar la búsqueda por voz. Puede escribir su búsqueda.'
}

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
  const entrada = useRef<HTMLInputElement>(null)
  const [Voz] = useState(constructorDeVoz)
  const [escuchando, setEscuchando] = useState(false)
  const [avisoVoz, setAvisoVoz] = useState('')

  function dictar() {
    if (Voz === null || escuchando) return
    const reconocimiento = new Voz()
    reconocimiento.lang = 'es-CO'
    reconocimiento.interimResults = false
    reconocimiento.maxAlternatives = 1
    reconocimiento.onresult = (evento) => {
      const texto = (evento.results[0]?.[0]?.transcript ?? '').trim().slice(0, 100)
      const campo = entrada.current
      if (texto === '' || campo === null) return
      campo.value = texto
      setVacio(false)
      campo.form?.requestSubmit()
    }
    reconocimiento.onerror = (evento) => {
      setAvisoVoz(mensajeDeErrorDeVoz(evento.error))
      setEscuchando(false)
    }
    reconocimiento.onend = () => setEscuchando(false)
    setAvisoVoz('')
    setEscuchando(true)
    try {
      reconocimiento.start()
    } catch {
      setEscuchando(false)
      setAvisoVoz(mensajeDeErrorDeVoz(''))
    }
  }
  const animando = !reducido && !enfocado && vacio
  const texto = usePlaceholderAnimado(GUION_BUSCADOR, animando)

  return (
    <TextInput
      ref={entrada}
      name="q"
      label="Busque por título, autor o tema"
      placeholder={PLACEHOLDER_BUSCADOR}
      defaultValue={valorInicial}
      maxLength={100}
      description={
        escuchando || avisoVoz !== '' ? (
          <span role="status">{escuchando ? 'Escuchando…' : avisoVoz}</span>
        ) : undefined
      }
      rightSectionWidth={Voz === null ? undefined : 48}
      rightSection={
        Voz === null ? undefined : (
          <>
            <ActionIcon
              type="button"
              variant={escuchando ? 'filled' : 'subtle'}
              color="dark"
              size={40}
              aria-label="Buscar por voz"
              aria-pressed={escuchando}
              aria-describedby="ayuda-voz"
              title={AYUDA_VOZ}
              onClick={dictar}
            >
              <IconoMicrofono size={22} />
            </ActionIcon>
            <VisuallyHidden id="ayuda-voz">{AYUDA_VOZ}</VisuallyHidden>
          </>
        )
      }
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
