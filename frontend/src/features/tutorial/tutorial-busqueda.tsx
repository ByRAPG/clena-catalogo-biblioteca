import { Button, SegmentedControl } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as EventoTeclado,
} from 'react'
import { LOGO_LLEVA_NOMBRE, LogoMarca } from '../../shared/ui/marca'
import { EjemploCoincidencia } from './ejemplo-coincidencia'
import {
  EVENTO_CABECERA_MENU,
  EVENTO_INTRO_TERMINADA,
  EVENTO_TUTORIAL,
  pasosParaDispositivo,
  textoDelPaso,
  type Dispositivo,
} from './pasos'
import { RESPALDO_INTRO_MS, alTerminarEntrada, entradaActiva } from './entrada-inicial'
import {
  HOLGURA_ANILLO,
  MARGEN_VIEWPORT,
  anchoTarjeta,
  calcularPosicion,
  conAnillo,
  destinoScroll,
  esMovil,
  objetivoFuera,
  trazadoVelo,
  type Caja,
  type Modo,
} from './posicion'
import './tutorial.css'
import {
  introPendiente,
  marcarTutorialVisto,
  tutorialYaVisto,
} from './tutorial-visto'

/** Cuadros consecutivos idénticos para dar por terminado el desplazamiento. */
const CUADROS_ESTABLES = 4
const ESPERA_MINIMA_MS = 100
const ESPERA_MAXIMA_MS = 3000
/** Respaldo si la intro no avisa: algo después del respaldo de la entrada. */
const RESPALDO_APERTURA_MS = RESPALDO_INTRO_MS + 200

/** Elemento real al que apunta el paso, o null si no está en esta pantalla. */
function buscarObjetivo(id: string | undefined, completo = false): HTMLElement | null {
  if (id === undefined) return null
  const el = document.querySelector<HTMLElement>(`[data-tutorial="${id}"]`)
  if (el === null) return null
  // «primero»: se resalta el primer hijo (p. ej. la primera tarjeta de una lista),
  // salvo que el paso pida el elemento entero.
  return !completo && el.dataset.tutorialHijo === 'primero'
    ? (el.firstElementChild as HTMLElement | null)
    : el
}

function medir(el: HTMLElement | null): Caja | null {
  if (el === null) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return null
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

/** Viewport útil: sin la barra de scroll. */
function viewport() {
  const raiz = document.documentElement
  return {
    vw: raiz.clientWidth || window.innerWidth,
    vh: raiz.clientHeight || window.innerHeight,
  }
}

/**
 * Borde inferior de la cabecera flotante (fija o pegajosa). Su caja puede medir 0
 * de alto y la píldora desbordarla, por eso también se miden sus hijos.
 */
function bordeCabecera(): number {
  let max = 0
  document.querySelectorAll<HTMLElement>('header').forEach((h) => {
    const pos = getComputedStyle(h).position
    if (pos !== 'fixed' && pos !== 'sticky') return
    const r = h.getBoundingClientRect()
    if (r.top > 8) return
    let borde = r.bottom
    for (const hijo of Array.from(h.children)) {
      borde = Math.max(borde, hijo.getBoundingClientRect().bottom)
    }
    max = Math.max(max, borde)
  })
  return max
}

const sinAnimacion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/**
 * Botón «¿Cómo buscar?» y recorrido guiado sobre la propia interfaz. Resalta
 * los elementos reales (`data-tutorial`) con un anillo ámbar, sin bloquear el
 * desplazamiento. Se abre solo la primera vez, después de la intro si la hay.
 * Los pasos viven en `pasos.ts`; el cálculo de posición, en `posicion.ts`.
 */
export function TutorialBusqueda() {
  const tactil = useMediaQuery('(pointer: coarse)') === true
  const [manual, setManual] = useState<Dispositivo | null>(null)
  const dispositivo: Dispositivo = manual ?? (tactil ? 'celular' : 'computador')

  const [esperandoIntro] = useState(() => !tutorialYaVisto() && introPendiente())
  const [abierto, setAbierto] = useState(
    () => !tutorialYaVisto() && !esperandoIntro && !entradaActiva(),
  )
  // -1 = portada; 0..n-1 = pasos.
  const [indice, setIndice] = useState(-1)
  // El elemento del paso no está en esta pantalla (se muestra el ejemplo).
  const [sinElemento, setSinElemento] = useState(false)

  const pasos = pasosParaDispositivo(dispositivo)
  const total = pasos.length
  const paso = indice >= 0 ? pasos[Math.min(indice, total - 1)] : null
  const esUltimo = indice === total - 1
  const objetivo = paso?.objetivo
  const completo = paso?.completo === true
  const enPortada = indice < 0

  const idTitulo = useId()
  const tarjeta = useRef<HTMLDivElement>(null)
  const velo = useRef<HTMLDivElement>(null)
  const anillo = useRef<HTMLDivElement>(null)
  // «Volver al paso»: se muestra o se oculta directamente en el DOM, en el mismo
  // cuadro que la posición, para que la tarjeta nunca cambie de alto ya visible.
  const volver = useRef<HTMLButtonElement>(null)
  const disparador = useRef<HTMLButtonElement>(null)
  const reencuadrar = useRef<() => void>(() => undefined)
  const abiertoAhora = useRef(abierto)
  useEffect(() => {
    abiertoAhora.current = abierto
  }, [abierto])

  const cerrar = useCallback(() => {
    marcarTutorialVisto()
    setAbierto(false)
  }, [])
  const abrir = useCallback(() => {
    // Estado interno limpio: la bienvenida nunca hereda nada de un paso previo.
    setIndice(-1)
    setSinElemento(false)
    setAbierto(true)
  }, [])

  // Otros componentes piden abrir el recorrido; la intro avisa al terminar.
  useEffect(() => {
    let sinEscuchar: () => void = () => undefined
    let yaPedida = false
    // Una sola apertura automática por intro/respaldo: el aviso de la intro y el
    // respaldo no se suman (reabrirían la bienvenida y la harían parpadear).
    const alTerminarIntro = () => {
      if (yaPedida) return
      yaPedida = true
      sinEscuchar = alTerminarEntrada(() => {
        if (!tutorialYaVisto() && !abiertoAhora.current) abrir()
      })
    }
    // Si la intro no llega a mostrarse (movimiento reducido, ahorro de datos),
    // no avisa: se abre igual pasados unos segundos.
    const espera = esperandoIntro ? window.setTimeout(alTerminarIntro, RESPALDO_APERTURA_MS) : 0
    // Sin intro pero con la entrada de la portada en curso: espera a que acabe.
    if (!esperandoIntro && !tutorialYaVisto() && entradaActiva()) alTerminarIntro()
    window.addEventListener(EVENTO_TUTORIAL, abrir)
    window.addEventListener(EVENTO_INTRO_TERMINADA, alTerminarIntro)
    return () => {
      sinEscuchar()
      window.clearTimeout(espera)
      window.removeEventListener(EVENTO_TUTORIAL, abrir)
      window.removeEventListener(EVENTO_INTRO_TERMINADA, alTerminarIntro)
    }
  }, [abrir, esperandoIntro])

  // Foco: al cerrar vuelve a donde estaba (o al botón «¿Cómo buscar?»).
  useEffect(() => {
    if (!abierto) return
    const previo = document.activeElement as HTMLElement | null
    const boton = disparador.current
    return () => {
      const destino =
        previo !== null && previo !== document.body && document.contains(previo)
          ? previo
          : boton
      destino?.focus()
    }
  }, [abierto])

  // Pasos cuyo objetivo está dentro del menú de la cabecera compacta: se abre al
  // llegar y se cierra al salir del paso, al omitir o al cerrar el recorrido.
  const abreMenu = paso?.abreMenu === true
  useEffect(() => {
    if (!abierto || !abreMenu) return
    // El botón «Menú» está arriba de la página (la cabecera solo es pegajosa en
    // pantallas anchas): se sube para que el panel se vea al abrirlo.
    if (window.scrollY > 0) {
      window.scrollTo({ top: 0, left: 0, behavior: sinAnimacion() ? 'auto' : 'smooth' })
    }
    window.dispatchEvent(new CustomEvent(EVENTO_CABECERA_MENU, { detail: { abierto: true } }))
    return () => {
      window.dispatchEvent(new CustomEvent(EVENTO_CABECERA_MENU, { detail: { abierto: false } }))
    }
  }, [abierto, abreMenu])

  useEffect(() => {
    if (!abierto) return
    tarjeta.current
      ?.querySelector<HTMLElement>('[data-autofocus]')
      ?.focus({ preventScroll: true })
  }, [abierto, indice])

  // Posicionamiento. Un único bucle por cuadro lee el objetivo y la tarjeta y
  // escribe directamente en el DOM (sin transiciones de posición):
  //  - el hueco del velo y el anillo siguen al objetivo en el mismo cuadro;
  //  - la tarjeta está oculta hasta que el objetivo lleva unos cuadros quieto
  //    tras el desplazamiento; entonces se coloca y se funde (150 ms);
  //  - después solo se reajusta si cambia algo medido (scroll, resize, tamaño).
  useLayoutEffect(() => {
    if (!abierto) return
    const carta = tarjeta.current
    const veloEl = velo.current
    const anilloEl = anillo.current
    if (carta === null || veloEl === null || anilloEl === null) return

    carta.dataset.lista = 'false'
    let cuadro = 0
    let fase: 'espera' | 'estable' = 'espera'
    let firmaPrevia = ''
    let iguales = 0
    let inicio = 0
    let habiaObjetivo = false
    // Scroll al que se va: la tarjeta no sale hasta llegar (o hasta el tiempo máximo).
    let scrollDestino: number | null = null
    let estadoSin = false

    const ponerModo = (modo: Modo, top: number, left: number, ancho: number) => {
      carta.dataset.modo = modo
      carta.style.setProperty('--tut-ancho', `${ancho}px`)
      if (modo === 'hoja') {
        carta.style.removeProperty('top')
        carta.style.removeProperty('left')
      } else {
        carta.style.top = `${Math.round(top)}px`
        carta.style.left = `${Math.round(left)}px`
      }
    }

    const dibujar = (c: Caja | null, vw: number, vh: number) => {
      veloEl.style.clipPath = trazadoVelo(vw, vh, c === null ? null : conAnillo(c))
      if (c === null) {
        anilloEl.dataset.visible = 'false'
        return
      }
      anilloEl.dataset.visible = 'true'
      anilloEl.style.top = `${c.top - HOLGURA_ANILLO}px`
      anilloEl.style.left = `${c.left - HOLGURA_ANILLO}px`
      anilloEl.style.width = `${c.width + HOLGURA_ANILLO * 2}px`
      anilloEl.style.height = `${c.height + HOLGURA_ANILLO * 2}px`
    }

    const colocar = (c: Caja | null, vw: number, vh: number, arriba: number) => {
      const ancho = anchoTarjeta(vw)
      const alto = carta.offsetHeight
      if (c === null) {
        const r = calcularPosicion({ vw, vh, arriba, objetivo: null, tarjeta: { ancho, alto } })
        ponerModo('centro', r.top, r.left, ancho)
      } else if (esMovil(vw)) {
        ponerModo('hoja', 0, 0, ancho)
      } else if (objetivoFuera(c, vh)) {
        const r = calcularPosicion({ vw, vh, arriba, objetivo: null, tarjeta: { ancho, alto } })
        ponerModo('dock', vh - MARGEN_VIEWPORT - alto, r.left, ancho)
      } else {
        const r = calcularPosicion({ vw, vh, arriba, objetivo: c, tarjeta: { ancho, alto } })
        ponerModo(r.modo, r.top, r.left, ancho)
      }
    }

    const desplazar = (c: Caja, vw: number, vh: number, arriba: number) => {
      // Un objetivo dentro de la cabecera flotante ya está a la vista: no se desplaza.
      scrollDestino = null
      if (c.top >= 0 && c.top + c.height <= arriba) return
      const destino = destinoScroll({
        top: c.top,
        alto: c.height,
        scrollY: window.scrollY,
        maxY: document.documentElement.scrollHeight - vh,
        vh,
        arriba,
        altoTarjeta: carta.offsetHeight,
        movil: esMovil(vw),
      })
      if (Math.abs(destino - window.scrollY) > 2) {
        scrollDestino = destino
        window.scrollTo({
          top: destino,
          left: 0,
          behavior: sinAnimacion() ? 'auto' : 'smooth',
        })
      }
    }

    const empezarEspera = () => {
      fase = 'espera'
      iguales = 0
      firmaPrevia = ''
      inicio = performance.now()
      carta.dataset.lista = 'false'
    }

    // Cambiar el contraste en medio del recorrido altera tamaños y colores: se
    // vuelve a medir el objetivo y a colocar la tarjeta.
    let contrastePrevio = document.documentElement.getAttribute('data-alto-contraste')
    const ciclo = () => {
      cuadro = requestAnimationFrame(ciclo)
      const contraste = document.documentElement.getAttribute('data-alto-contraste')
      if (contraste !== contrastePrevio) {
        contrastePrevio = contraste
        empezarEspera()
      }
      if (window.scrollX !== 0) window.scrollTo({ left: 0, behavior: 'instant' })
      const { vw, vh } = viewport()
      const c = medir(buscarObjetivo(objetivo, completo))
      const arriba = bordeCabecera()

      // Sin elemento: bienvenida, o paso cuyo elemento no está en esta pantalla.
      if (c === null) {
        const sin = objetivo !== undefined
        if (sin !== estadoSin) {
          estadoSin = sin
          setSinElemento(sin)
        }
        if (volver.current !== null) volver.current.hidden = true
        habiaObjetivo = false
        dibujar(null, vw, vh)
        const firma = `c|${vw}|${vh}|${carta.offsetWidth}|${carta.offsetHeight}|${sin}`
        if (firma !== firmaPrevia || carta.dataset.lista !== 'true') {
          firmaPrevia = firma
          colocar(null, vw, vh, arriba)
          carta.dataset.lista = 'true'
        }
        return
      }
      if (estadoSin) {
        estadoSin = false
        setSinElemento(false)
      }
      if (!habiaObjetivo) {
        // El elemento acaba de aparecer (o es el primer cuadro): se acerca a la vista.
        habiaObjetivo = true
        empezarEspera()
        desplazar(c, vw, vh, arriba)
      }

      const f = objetivoFuera(c, vh)
      dibujar(f ? null : c, vw, vh)
      if (volver.current !== null) volver.current.hidden = !(f && fase === 'estable')

      const firma = `${c.top}|${c.left}|${c.width}|${c.height}|${window.scrollY}|${vw}|${vh}|${carta.offsetWidth}|${carta.offsetHeight}`
      if (fase === 'espera') {
        iguales = firma === firmaPrevia ? iguales + 1 : 0
        firmaPrevia = firma
        const dur = performance.now() - inicio
        const llegado = scrollDestino === null || Math.abs(window.scrollY - scrollDestino) <= 2
        if ((llegado && iguales >= CUADROS_ESTABLES && dur >= ESPERA_MINIMA_MS) || dur > ESPERA_MAXIMA_MS) {
          fase = 'estable'
          colocar(c, vw, vh, arriba)
          carta.dataset.lista = 'true'
        }
      } else if (firma !== firmaPrevia) {
        firmaPrevia = firma
        colocar(c, vw, vh, arriba)
      }
    }

    reencuadrar.current = () => {
      const { vw, vh } = viewport()
      const c = medir(buscarObjetivo(objetivo, completo))
      empezarEspera()
      if (c !== null) desplazar(c, vw, vh, bordeCabecera())
    }

    ciclo()
    return () => cancelAnimationFrame(cuadro)
  }, [abierto, objetivo, completo, indice, dispositivo])

  const ir = (nuevo: number) => setIndice(Math.max(-1, Math.min(total - 1, nuevo)))

  // Flechas izquierda/derecha y Escape.
  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cerrar()
        return
      }
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      const destino = e.target
      if (
        destino instanceof Element &&
        destino.closest('[role="radiogroup"], input, select, textarea') !== null
      )
        return
      e.preventDefault()
      setIndice((i) =>
        e.key === 'ArrowRight' ? Math.min(total - 1, i + 1) : Math.max(-1, i - 1),
      )
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [abierto, cerrar, total])

  // Tab no sale de la tarjeta.
  const atraparTab = (e: EventoTeclado<HTMLDivElement>) => {
    if (e.key !== 'Tab') return
    const foco = Array.from(
      tarjeta.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled])',
      ) ?? [],
    ).filter((el) => el.tabIndex >= 0 && !el.hidden)
    if (foco.length === 0) return
    const primero = foco[0]
    const ultimo = foco[foco.length - 1]
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault()
      ultimo.focus()
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault()
      primero.focus()
    }
  }

  return (
    <>
      <Button
        ref={disparador}
        type="button"
        variant="light"
        onClick={abrir}
        style={{ minHeight: 44, alignSelf: 'flex-start' }}
      >
        ¿Cómo buscar?
      </Button>

      {abierto && (
        <div className="tutorial-capa">
          {/* Un solo velo, siempre montado; el hueco sobre el objetivo es un clip-path. */}
          <div ref={velo} className="tutorial-velo" aria-hidden="true" />
          <div ref={anillo} className="tutorial-foco" aria-hidden="true" data-visible="false" />

          <div
            ref={tarjeta}
            role="dialog"
            aria-modal="true"
            aria-labelledby={idTitulo}
            className={enPortada ? 'tutorial-tarjeta tutorial-tarjeta-portada' : 'tutorial-tarjeta'}
            onKeyDown={atraparTab}
          >
            <button
              type="button"
              className="tutorial-cerrar"
              aria-label="Cerrar el recorrido"
              onClick={cerrar}
            >
              <span aria-hidden="true">×</span>
            </button>

            {enPortada || paso === null ? (
              <div className="tutorial-portada">
                {LOGO_LLEVA_NOMBRE ? (
                  <LogoMarca
                    size={55}
                    titulo="Busca Fácil"
                    className="tutorial-portada-logo tutorial-portada-logo-nombre"
                  />
                ) : (
                  <>
                    <LogoMarca size={56} className="tutorial-portada-logo" />
                    <p className="tutorial-portada-marca">Busca Fácil</p>
                  </>
                )}
                <h2 id={idTitulo} className="tutorial-titulo tutorial-titulo-portada">
                  ¿Cómo buscar un libro?
                </h2>
                <p className="tutorial-portada-texto">
                  Un recorrido de {total} pasos sobre esta misma pantalla. Dura menos de
                  un minuto.
                </p>
              </div>
            ) : (
              <div aria-live="polite" className="tutorial-cuerpo">
                <div className="tutorial-cabeza">
                  <span className="tutorial-numero" aria-hidden="true">
                    {indice + 1}
                  </span>
                  <div>
                    <p className="rotulo tutorial-rotulo">{`Paso ${indice + 1} de ${total}`}</p>
                    <h2 id={idTitulo} className="tutorial-titulo">
                      {paso.titulo}
                    </h2>
                  </div>
                </div>
                <p className="tutorial-texto">{textoDelPaso(paso, dispositivo)}</p>
                {paso.muestras !== undefined && <EjemploCoincidencia muestras={paso.muestras} />}
                {(objetivo === undefined || sinElemento) && paso.ejemplo !== undefined && (
                  <p className="tutorial-ejemplo">
                    <span className="rotulo">Ejemplo</span>
                    {paso.ejemplo}
                  </p>
                )}
              </div>
            )}

            {!enPortada && (
              <Button
                ref={volver}
                type="button"
                variant="light"
                className="tutorial-volver"
                hidden
                onClick={() => reencuadrar.current()}
              >
                Volver al paso
              </Button>
            )}

            {!enPortada && (
              <div className="tutorial-puntos" aria-hidden="true">
                {pasos.map((p, i) => (
                  <span
                    key={p.id}
                    className={
                      i === indice
                        ? 'tutorial-punto tutorial-punto-actual'
                        : i < indice
                          ? 'tutorial-punto tutorial-punto-hecho'
                          : 'tutorial-punto'
                    }
                  />
                ))}
              </div>
            )}

            <div className="tutorial-dispositivo">
              <span className="tutorial-dispositivo-rotulo" id={`${idTitulo}-disp`}>
                Ver para:
              </span>
              <SegmentedControl
                aria-labelledby={`${idTitulo}-disp`}
                size="sm"
                transitionDuration={0}
                value={dispositivo}
                onChange={(v) => setManual(v as Dispositivo)}
                data={[
                  { value: 'computador', label: 'Computador' },
                  { value: 'celular', label: 'Celular' },
                ]}
              />
            </div>

            <div className="tutorial-acciones">
              <Button
                type="button"
                variant="subtle"
                className="tutorial-omitir"
                onClick={cerrar}
              >
                Omitir
              </Button>
              <div className="tutorial-acciones-nav">
                {!enPortada && (
                  <Button
                    type="button"
                    variant="default"
                    className="tutorial-secundario"
                    onClick={() => ir(indice - 1)}
                  >
                    Anterior
                  </Button>
                )}
                {esUltimo ? (
                  <Button type="button" onClick={cerrar} data-autofocus className="tutorial-primario">
                    Terminar
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => ir(indice + 1)}
                    data-autofocus
                    className="tutorial-primario"
                  >
                    {enPortada ? 'Empezar' : 'Siguiente'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
