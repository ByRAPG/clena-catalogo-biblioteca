import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Button, Popover } from '@mantine/core'
import { NavLink, useLocation } from 'react-router-dom'
import { ControlesAccesibilidad } from '../features/accessibility/controles-accesibilidad'
import { useAccesibilidad } from '../features/accessibility/preferencias-context'
import { useSesion, type Rol } from '../features/auth/sesion-context'
import { decidirNivel, NIVEL_MENU } from './cabecera-ajuste'
import { EVENTO_CABECERA_MENU } from '../features/tutorial/pasos'
import { IconoCatalogo, IconoMenu, IconoUsuario } from '../shared/ui/iconos'
import { LogosCabecera } from '../shared/ui/marca'

/** Mismo criterio que las rutas de /gestion: solo el personal. */
function puedeGestionar(rol: Rol) {
  return rol === 'ADMIN' || rol === 'STAFF'
}

/**
 * Acciones de sesión como botones con contorno: «Ingresar» o «Gestión» (enlaces)
 * y «Cerrar sesión» (relleno ámbar). Se usa en la fila de la cabecera y en el
 * menú compacto.
 */
function AccionesSesion({ alElegir }: { alElegir?: () => void }) {
  const { sesion, recuperando, cerrarSesion } = useSesion()
  const [cerrandoSesion, setCerrandoSesion] = useState(false)

  async function salir() {
    if (cerrandoSesion) return
    setCerrandoSesion(true)
    try {
      await cerrarSesion()
    } catch {
      // Si el backend no responde, `cerrarSesion` igual deja la sesión cerrada
      // en este navegador: no hay nada más que mostrar.
    } finally {
      setCerrandoSesion(false)
      alElegir?.()
    }
  }

  return (
    <>
      {/* Mientras se recupera la sesión se reserva el ancho de «Ingresar»: así los
          botones de al lado no se corren cuando aparece (sin salto de diseño). */}
      {recuperando && (
        <span className="navegacion-enlace navegacion-reserva" aria-hidden="true">
          <IconoUsuario size={18} />
          Ingresar
        </span>
      )}
      {!recuperando && sesion && puedeGestionar(sesion.rol) && (
        <NavLink to="/gestion" className="navegacion-enlace" onClick={alElegir}>
          <IconoCatalogo size={18} />
          Gestión
        </NavLink>
      )}
      {!recuperando && !sesion && (
        <NavLink to="/ingresar" className="navegacion-enlace" onClick={alElegir}>
          <IconoUsuario size={18} />
          Ingresar
        </NavLink>
      )}
      {sesion && (
        <Button
          variant="white"
          style={{ minHeight: 44 }}
          onClick={() => void salir()}
          loading={cerrandoSesion}
        >
          Cerrar sesión
        </Button>
      )}
    </>
  )
}

/**
 * Menú de la cabecera compacta: utilidades de accesibilidad y sesión. Lo abre
 * el botón «Menú» o, durante el recorrido guiado, el evento `clena:cabecera-menu`
 * (en ese caso no atrapa el foco, ni se cierra con un clic fuera ni con Esc, y
 * al cerrarse no mueve el foco: el recorrido conserva el suyo).
 */
function MenuCompacto() {
  const idPanel = useId()
  const { pathname } = useLocation()
  // Se guarda en qué ruta se abrió: al cambiar de ruta (por ejemplo «atrás») el
  // menú queda cerrado sin sincronizar estado dentro de un efecto.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null)
  const [porRecorrido, setPorRecorrido] = useState(false)
  const abierto = abiertoEn === pathname
  const botonRef = useRef<HTMLButtonElement>(null)
  const setAbierto = (valor: boolean) => {
    setAbiertoEn(valor ? pathname : null)
    setPorRecorrido(false)
    // Al cerrar (Esc, clic fuera o elegir una opción) el foco vuelve al botón.
    if (!valor) botonRef.current?.focus()
  }

  useEffect(() => {
    const alPedir = (evento: Event) => {
      const pide = (evento as CustomEvent<{ abierto?: boolean }>).detail?.abierto === true
      setPorRecorrido(pide)
      setAbiertoEn(pide ? pathname : null)
    }
    window.addEventListener(EVENTO_CABECERA_MENU, alPedir)
    return () => window.removeEventListener(EVENTO_CABECERA_MENU, alPedir)
  }, [pathname])

  return (
    <Popover
      opened={abierto}
      onChange={setAbierto}
      position="bottom-end"
      offset={8}
      width="min(22rem, calc(100vw - 1rem))"
      trapFocus={!porRecorrido}
      closeOnEscape={!porRecorrido}
      closeOnClickOutside={!porRecorrido}
      withinPortal
      hideDetached={false}
      zIndex={300}
      transitionProps={{ duration: 0 }}
    >
      <Popover.Target>
        <button
          ref={botonRef}
          type="button"
          className="boton-menu"
          aria-label="Menú"
          aria-expanded={abierto}
          aria-controls={idPanel}
          onClick={() => setAbierto(!abierto)}
        >
          <IconoMenu size={22} />
          <span className="boton-menu-texto" aria-hidden="true">
            Menú
          </span>
        </button>
      </Popover.Target>
      {/* `data-tutorial`: el recorrido resalta el panel entero (letra, contraste y sesión). */}
      <Popover.Dropdown
        id={idPanel}
        className="menu-movil"
        aria-label="Menú"
        data-tutorial="accesibilidad"
      >
        <ControlesAccesibilidad />
        <nav aria-label="Principal" className="menu-movil-sesion">
          <AccionesSesion alElegir={() => setAbierto(false)} />
        </nav>
      </Popover.Dropdown>
    </Popover>
  )
}

/**
 * Contenido de la píldora de la cabecera: UNA sola fila con los cuatro logos a
 * la izquierda. Las acciones (letra, contraste, sesión) van a la derecha en la
 * misma fila. La decisión se toma por medida real (no por el ancho de la
 * ventana): se prueban los niveles de compactación en orden, antes de pintar,
 * y solo si ninguno cabe las acciones pasan al botón «Menú». Ver `cabecera-ajuste.ts`.
 */
export function CabeceraContenido() {
  const { preferencias } = useAccesibilidad()
  const { sesion, recuperando } = useSesion()
  const filaRef = useRef<HTMLDivElement>(null)
  const [vista, setVista] = useState({ nivel: 0, sonda: false })
  const vistaRef = useRef(vista)
  useLayoutEffect(() => {
    vistaRef.current = vista
  })
  const firma = `${preferencias.letraGrande}|${preferencias.altoContraste}|${sesion?.rol ?? ''}|${recuperando}`

  /** Prueba los niveles sobre el DOM (síncrono, sin pintar) y fija el elegido. */
  const medir = useCallback(() => {
    const fila = filaRef.current
    const logos = fila?.querySelector<HTMLElement>('.cabecera-logos')
    const acciones = fila?.querySelector<HTMLElement>('.cabecera-acciones')
    // Sin diseño medible (pruebas en jsdom) se muestra la fila completa.
    if (!fila || !logos || !acciones || fila.clientWidth === 0) return
    const estilo = getComputedStyle(fila)
    const disponible =
      fila.clientWidth -
      (Number.parseFloat(estilo.paddingLeft) || 0) -
      (Number.parseFloat(estilo.paddingRight) || 0)
    const separacion = Number.parseFloat(estilo.columnGap) || 0
    fila.setAttribute('data-midiendo', '')
    const holguras: number[] = []
    for (let nivel = 0; nivel < NIVEL_MENU; nivel++) {
      fila.setAttribute('data-nivel', String(nivel))
      const necesario =
        logos.getBoundingClientRect().width +
        separacion +
        acciones.getBoundingClientRect().width
      holguras.push(disponible - necesario)
    }
    fila.removeAttribute('data-midiendo')
    const previo = vistaRef.current
    const actual = previo.sonda ? NIVEL_MENU : previo.nivel
    const nivel = decidirNivel(holguras, actual)
    fila.setAttribute('data-nivel', nivel === NIVEL_MENU ? 'menu' : String(nivel))
    setVista((v) => (v.nivel === nivel && !v.sonda ? v : { nivel, sonda: false }))
  }, [])

  /** Reevalúa: con las acciones en la barra se mide directo; desde el menú se monta antes la fila de prueba. */
  const reevaluar = useCallback(() => {
    const fila = filaRef.current
    if (!fila || fila.clientWidth === 0) return
    if (fila.querySelector('.cabecera-acciones')) medir()
    else setVista((v) => (v.sonda ? v : { ...v, sonda: true }))
  }, [medir])

  // Cambió la combinación de letra, contraste o sesión.
  useLayoutEffect(() => {
    reevaluar()
  }, [firma, reevaluar])

  // Fila de prueba montada (venía del menú): se mide antes de pintar.
  useLayoutEffect(() => {
    if (vista.sonda) medir()
  }, [vista.sonda, medir])

  // Cambia el ancho (ventana o zoom), el tamaño de letra o terminan de cargar las fuentes.
  useEffect(() => {
    const fila = filaRef.current
    if (!fila) return
    let ancho = fila.clientWidth
    const alCambiar = () => {
      if (fila.clientWidth !== ancho) {
        ancho = fila.clientWidth
        reevaluar()
      }
    }
    const observadorTamano =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(alCambiar)
    observadorTamano?.observe(fila)
    window.addEventListener('resize', reevaluar)
    const observadorAtributos = new MutationObserver(reevaluar)
    observadorAtributos.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-letra-grande', 'data-alto-contraste', 'style', 'class'],
    })
    void document.fonts?.ready.then(reevaluar)
    return () => {
      observadorTamano?.disconnect()
      window.removeEventListener('resize', reevaluar)
      observadorAtributos.disconnect()
    }
  }, [reevaluar])

  const compacta = vista.nivel === NIVEL_MENU && !vista.sonda
  return (
    <div
      ref={filaRef}
      className="marco-ancho cabecera-fila"
      data-compacta={compacta}
      data-sonda={vista.sonda || undefined}
      data-nivel={compacta ? 'menu' : vista.sonda ? 0 : vista.nivel}
    >
      <LogosCabecera />
      {/* Durante la prueba el menú sigue montado (si estaba abierto no se cierra)
          y las acciones se montan a su lado, solo para medirlas. */}
      {(compacta || vista.sonda) && <MenuCompacto />}
      {!compacta && (
        <div className="cabecera-acciones">
          <ControlesAccesibilidad />
          <nav aria-label="Principal" className="navegacion">
            <AccionesSesion />
          </nav>
        </div>
      )}
    </div>
  )
}
