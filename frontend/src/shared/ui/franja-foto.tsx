import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'
import '../../app/fondos.css'

export type FotoFondo = 'pov' | 'interior'
export type TonoFranja = 'marino' | 'granate' | 'ambar'

interface Props {
  as?: ElementType
  className?: string
  foto: FotoFondo
  tono: TonoFranja
  children?: ReactNode
  [atributo: string]: unknown
}

/** Conexión del navegador con el modo de ahorro de datos (no está en el tipo DOM). */
function ahorraDatos(): boolean {
  const conexion = (navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection
  return conexion?.saveData === true
}

/**
 * ¿La foto ya está en la memoria del navegador (precargada desde index.html)? Si es
 * así la franja nace con la foto puesta y sin fundido: no hay salto de degradado a foto.
 */
function fotoYaCargada(foto: FotoFondo): boolean {
  if (typeof Image === 'undefined' || ahorraDatos()) return false
  const imagen = new Image()
  imagen.src = `/fondos/${foto}.webp`
  return imagen.complete && imagen.naturalWidth > 0
}

/**
 * Franja de color de marca con una foto de la biblioteca detrás de un filtro
 * translúcido. La franja nace con su degradado de marca (se ve antes de
 * cualquier descarga) y la foto solo se pide cuando la franja está por entrar
 * al viewport. Si la foto no existe o falla, queda el degradado: la foto es un
 * realce, nunca un requisito. Filtros y contrastes en `app/fondos.css`.
 */
export function FranjaFoto({
  as: Etiqueta = 'div',
  className = '',
  foto,
  tono,
  children,
  style,
  ...resto
}: Props) {
  const ref = useRef<HTMLElement | null>(null)
  const [lista, setLista] = useState(() => fotoYaCargada(foto))

  useEffect(() => {
    const nodo = ref.current
    if (nodo === null || typeof IntersectionObserver === 'undefined') return
    if (ahorraDatos() || lista) return
    let vivo = true
    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return
        observador.disconnect()
        const imagen = new Image()
        imagen.decoding = 'async'
        imagen.onload = () => {
          if (vivo) setLista(true)
        }
        // Sin foto o con fallo de red: se queda el degradado, sin avisos.
        imagen.src = `/fondos/${foto}.webp`
      },
      { rootMargin: '300px 0px' },
    )
    observador.observe(nodo)
    return () => {
      vivo = false
      observador.disconnect()
    }
    // `lista` solo se lee al montar o al cambiar la foto: si ya estaba lista no se pide de nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foto])

  const estilo = {
    ...(style as CSSProperties | undefined),
    '--foto-url': `url(/fondos/${foto}.webp)`,
  } as CSSProperties

  return (
    <Etiqueta
      ref={ref}
      className={`franja franja-${tono}${lista ? ' franja-lista' : ''} ${className}`.trim()}
      style={estilo}
      {...resto}
    >
      {children}
    </Etiqueta>
  )
}
