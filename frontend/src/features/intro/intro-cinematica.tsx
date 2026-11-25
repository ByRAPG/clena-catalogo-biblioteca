import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'
import {
  DURACION_INTRO_MS,
  EVENTO_INTRO_REVELANDO,
  FRACCION_TELON,
  MARGEN_RESPALDO_MS,
} from './tiempos'
import './intro-cinematica.css'

const CLAVE = 'clena:intro-vista'
const SIN_MOVIMIENTO = '(prefers-reduced-motion: reduce), (forced-colors: active)'

/** Foto decorativa: si no carga, el panel queda con su degradado de color. */
function Foto({ src }: { src: string }) {
  const [fallo, setFallo] = useState(false)
  if (fallo) return null
  return <img className="intro-foto" src={src} alt="" decoding="async" onError={() => setFallo(true)} />
}

/** Una vez por sesión, solo en la portada y nunca con ajustes que piden calma. */
function debeMostrarse(ruta: string) {
  if (ruta !== '/') return false
  try {
    if (sessionStorage.getItem(CLAVE) !== null) return false
  } catch {
    return false
  }
  if (window.matchMedia?.(SIN_MOVIMIENTO).matches) return false
  if (document.documentElement.dataset.altoContraste === 'true') return false
  const conexion = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return conexion?.saveData !== true
}

/**
 * Intro de marca: Uninorte (filtro rojo, izquierda) y CLENA (filtro azul marino,
 * derecha), con sus fotos bajo el filtro de color, entran, muestran el logo y salen como
 * un telón. Solo CSS (transform y opacity), decorativa y sin bloquear la app.
 * Se quita sola, con el botón o con cualquier tecla, clic o rueda.
 */
export default function IntroCinematica() {
  const { pathname } = useLocation()
  const [activa, setActiva] = useState(() => debeMostrarse(pathname))
  const avisada = useRef(false)
  const revelada = useRef(false)

  /** Avisa una sola vez que el telón se abre: la portada empieza a entrar. */
  const revelar = () => {
    if (revelada.current) return
    revelada.current = true
    window.dispatchEvent(new Event(EVENTO_INTRO_REVELANDO))
  }

  const terminar = () => {
    setActiva(false)
    revelar()
    if (avisada.current) return
    avisada.current = true
    window.dispatchEvent(new Event('clena:intro-terminada'))
  }

  useEffect(() => {
    if (!activa) return
    try {
      sessionStorage.setItem(CLAVE, '1')
    } catch {
      // Sin almacenamiento la intro igual se quita sola.
    }
    const fin = () => terminar()
    const revela = window.setTimeout(revelar, DURACION_INTRO_MS * FRACCION_TELON)
    const espera = window.setTimeout(fin, DURACION_INTRO_MS + MARGEN_RESPALDO_MS)
    const eventos = ['keydown', 'pointerdown', 'wheel'] as const
    eventos.forEach((e) => window.addEventListener(e, fin, { passive: true }))
    return () => {
      window.clearTimeout(revela)
      window.clearTimeout(espera)
      eventos.forEach((e) => window.removeEventListener(e, fin))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa])

  if (!activa) return null

  return (
    <div className="intro" aria-hidden="true" style={{ '--dur': `${DURACION_INTRO_MS}ms` } as CSSProperties}>
      <div className="intro-lado intro-uninorte">
        <span className="intro-f-oro" />
        <span className="intro-f-amarillo" />
        <div className="intro-bloque intro-bloque-uni">
          <div className="intro-escena">
            <Foto src="/intro/bloque-k.webp" />
          </div>
          <span className="intro-filtro intro-filtro-uni" />
          <div className="intro-marca">
            <div className="intro-placa">
              <img src="/intro/uninorte-recorte.png" alt="" onError={terminar} />
            </div>
          </div>
        </div>
      </div>
      <div
        className="intro-lado intro-clena"
        onAnimationEnd={(e) => e.target === e.currentTarget && e.animationName.startsWith('intro-sale') && terminar()}
      >
        <span className="intro-f-ambar" />
        <span className="intro-f-granate" />
        <div className="intro-bloque intro-bloque-cle">
          <div className="intro-escena">
            <Foto src="/intro/biblioteca.webp" />
          </div>
          <span className="intro-filtro intro-filtro-cle" />
          <div className="intro-marca">
            <img src="/intro/clena-blanco.svg" alt="" onError={terminar} />
          </div>
        </div>
      </div>
      <button type="button" className="intro-saltar" tabIndex={-1} onClick={terminar}>
        Saltar animación
      </button>
    </div>
  )
}
