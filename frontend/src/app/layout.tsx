import { lazy, Suspense, useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { Anchor } from '@mantine/core'
import { NavLink, Outlet } from 'react-router-dom'
import { AccesibilidadProvider } from '../features/accessibility/accesibilidad-provider'
import { CabeceraContenido } from './cabecera'
import { CreditosInstitucionales } from '../shared/ui/creditos-institucionales'
import { FranjaFoto } from '../shared/ui/franja-foto'
import { Marca } from '../shared/ui/marca'
import { iniciarRevelado } from '../shared/efectos/revelar'
import './marco.css'
import './revelar.css'
import { useTituloPagina } from './titulo-pagina'

/** Intro de marca: solo existe en el build si VITE_INTRO_CINEMATICA=true. */
const IntroCinematica =
  import.meta.env.VITE_INTRO_CINEMATICA === 'true'
    ? lazy(() => import('../features/intro/intro-cinematica'))
    : null

/**
 * Publica en <html> el alto que ocupa la cabecera flotante (`--alto-cabecera`,
 * en px) para que las franjas de foto la despejen y el foco y las anclas no
 * queden ocultos debajo de ella. Se recalcula con ResizeObserver (cambia con la
 * letra grande, el ancho y la sesión), nunca por fotograma.
 */
function useAltoCabecera(ref: RefObject<HTMLElement | null>) {
  // Antes de pintar: así el hero no se desplaza al conocerse el alto real.
  useLayoutEffect(() => {
    const cabecera = ref.current
    const pildora = cabecera?.querySelector<HTMLElement>('.cabecera-pildora')
    if (!cabecera || !pildora) return
    const raiz = document.documentElement
    const medir = () => {
      const alto = pildora.getBoundingClientRect().bottom - cabecera.getBoundingClientRect().top
      raiz.style.setProperty('--alto-cabecera', `${Math.ceil(alto)}px`)
    }
    medir()
    if (typeof ResizeObserver === 'undefined') return
    const observador = new ResizeObserver(medir)
    observador.observe(pildora)
    return () => {
      observador.disconnect()
      raiz.style.removeProperty('--alto-cabecera')
    }
  }, [ref])
}

/**
 * Marco común de las pantallas públicas: cabecera (utilidades de
 * accesibilidad, marca y navegación), contenido y pie. El enlace «Saltar al
 * contenido» es requisito de accesibilidad: aparece al tabular y lleva directo
 * al <main>. `NavLink` marca la ruta activa con `aria-current="page"`.
 */
export function Layout() {
  useTituloPagina()
  const cabeceraRef = useRef<HTMLElement | null>(null)
  useAltoCabecera(cabeceraRef)
  useEffect(() => iniciarRevelado(), [])

  return (
    <AccesibilidadProvider>
      <Anchor href="#contenido" className="salto-al-contenido">
        Saltar al contenido
      </Anchor>

      {IntroCinematica && (
        <Suspense fallback={null}>
          <IntroCinematica />
        </Suspense>
      )}

      <div className="marco">
        <header className="cabecera" ref={cabeceraRef}>
          <div className="cabecera-pildora">
            <CabeceraContenido />
          </div>
        </header>

        <main id="contenido" className="marco-ancho marco-contenido">
          <Outlet />
        </main>

        <FranjaFoto as="footer" foto="interior" tono="marino" className="pie">
          <div className="marco-ancho pie-fila">
            <div className="pie-marca">
              <Marca />
              <CreditosInstitucionales />
            </div>
            <nav aria-label="Información" className="pie-enlaces">
              <NavLink to="/privacidad" className="pie-enlace">
                Aviso de privacidad
              </NavLink>
            </nav>
          </div>
          <div className="marco-ancho pie-base">
            <small>
              © {new Date().getFullYear()} Busca Fácil · Prototipo académico
            </small>
          </div>
        </FranjaFoto>
      </div>
    </AccesibilidadProvider>
  )
}
