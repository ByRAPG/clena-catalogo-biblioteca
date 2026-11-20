import { useState, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import { CONCEPTO_LOGO, type ConceptoLogo } from './logo-concepto'
import './logo.css'

/** `true` si el concepto elegido ya trae el nombre dibujado (logotipo horizontal). */
export const LOGO_LLEVA_NOMBRE = CONCEPTO_LOGO === 'c'

const NAVY = '#23234E'
const AMBAR = '#FCB040'

type PropsLogo = {
  /** Alto en px (en el logotipo horizontal, el ancho sale de su proporción 190:40). */
  size?: number
  /** `claro` para fondos oscuros; `oscuro` para fondos claros. */
  variante?: 'claro' | 'oscuro'
  /** `completo`: el logo del concepto; `simbolo`: versión compacta (cuadro con el símbolo; en el concepto c, el «BF»). */
  forma?: 'completo' | 'simbolo'
  /** Si se da, el logo se anuncia con ese nombre; si no, es decorativo. */
  titulo?: string
} & Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'width' | 'height'>

/**
 * Logo de Busca Fácil, dibujado para este proyecto, según `CONCEPTO_LOGO`.
 * Los conceptos a, b y bf son un cuadro redondeado (`claro`: ámbar con marino;
 * `oscuro`: marino con ámbar) y por debajo de 24 px el a usa el trazo grueso.
 * El concepto c es un logotipo horizontal; su `simbolo` es el «BF» (la B y la F del logotipo, juntas).
 */
export function LogoMarca({
  size = 32,
  variante = 'claro',
  forma = 'completo',
  titulo,
  ...resto
}: PropsLogo) {
  const claro = variante === 'claro'
  const accesible = titulo
    ? { role: 'img', 'aria-label': titulo }
    : { 'aria-hidden': true as const }
  if (CONCEPTO_LOGO === 'c') {
    const completo = forma === 'completo'
    const { className, ...otros } = resto
    return (
      <svg
        viewBox={completo ? '-6 -5 202 50' : '-2.5 -3 56 40'}
        width={Math.round(completo ? (size * 202) / 50 : (size * 56) / 40)}
        height={size}
        focusable="false"
        className={`logo-marca${className ? ` ${className}` : ''}`}
        data-variante={claro ? 'claro' : 'oscuro'}
        {...accesible}
        {...otros}
      >
        {completo ? (
          <>
            <rect className="logo-placa" x="-5" y="-4" width="200" height="48" rx="10" />
            <path className="logo-texto" strokeWidth="4.5" d={PALABRA_C} />
            <g className="logo-lupa bf-lupa" strokeWidth="4.5">
              <circle cx="87" cy="22" r="7" />
              <path d="M92 27L98 33" />
            </g>
            <circle className="logo-punto" cx="172" cy="6.5" r="2.6" />
          </>
        ) : (
          <>
            <rect className="logo-placa" x="-1.5" y="-2" width="54" height="38" rx="8" />
            <path className="logo-texto" strokeWidth={size < 24 ? 6 : 5} d={BF_C} />
          </>
        )}
      </svg>
    )
  }
  const fondo = claro ? AMBAR : NAVY
  const trazo = claro ? NAVY : AMBAR
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      focusable="false"
      {...accesible}
      {...resto}
    >
      <rect width="64" height="64" rx="14" fill={fondo} />
      <Simbolo concepto={CONCEPTO_LOGO} fondo={fondo} trazo={trazo} mini={size < 24} />
    </svg>
  )
}

/** «B» y «F» del logotipo, juntas (compacto BF): mismos trazos que PALABRA_C, la «F» corrida 79 a la izquierda. */
const BF_C =
  'M6 4V30M6 4H14A6.5 6.5 0 0 1 14 17H6M6 17H15.5A6.5 6.5 0 0 1 15.5 30H6 M29 30V4M29 4H45M29 16H41'

/** Letras de «Busca Fácil» (trazos); la lupa que hace de «a» se dibuja aparte. */
const PALABRA_C =
  'M6 4V30M6 4H14A6.5 6.5 0 0 1 14 17H6M6 17H15.5A6.5 6.5 0 0 1 15.5 30H6 M28 14V22A6 6 0 0 0 40 22M40 14V30 M57 17.5C55 15 47.5 14 47.5 19C47.5 24 57.5 21 57.5 26C57.5 31 49 30.5 46.5 27.5 M74.1 16.9A8 8 0 1 0 74.1 27.1 M108 30V4M108 4H124M108 16H120 M144 14V30M144 22A8 8 0 1 0 128 22A8 8 0 1 0 144 22M141 8L145 3 M164.1 16.9A8 8 0 1 0 164.1 27.1 M172 14V30M181 4V30'

/** Símbolo (dentro del cuadro de 64) del concepto elegido. */
function Simbolo({
  concepto,
  fondo,
  trazo,
  mini,
}: {
  concepto: ConceptoLogo
  fondo: string
  trazo: string
  mini: boolean
}) {
  const linea = {
    fill: 'none',
    stroke: trazo,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const
  if (concepto === 'b') {
    return mini ? (
      <>
        <path fill={trazo} d={LIBRO_MINI} />
        <circle cx="44" cy="40" r="9" fill={fondo} stroke={trazo} strokeWidth="6" />
        <path d="M50 47L58 56" stroke={trazo} strokeWidth="8" strokeLinecap="round" />
      </>
    ) : (
      <>
        <path fill={trazo} d={LIBRO} />
        <g {...linea} stroke={fondo} strokeWidth="2.6">
          <path d="M15 24V35M15 24H18.4A2.7 2.7 0 0 1 18.4 29.4H15M15 29.4H19.2A2.8 2.8 0 0 1 19.2 35H15" />
          <path d="M36 24V35M36 24H43M36 29.5H41.5" />
        </g>
        <circle cx="45" cy="43" r="7.5" fill={trazo} stroke={fondo} strokeWidth="5" />
        <path d="M50.6 48.6L57 55" stroke={fondo} strokeWidth="6.5" strokeLinecap="round" />
      </>
    )
  }
  if (concepto === 'bf') {
    return <path fill={trazo} fillRule="evenodd" d={BF} />
  }
  return mini ? (
    <g transform="translate(-3 -1)" {...linea} strokeWidth="8">
      <path d="M20 12V50M20 12H31A8 8 0 0 1 31 28H20M20 28H33A9 9 0 0 1 33 46H20" />
      <path d="M42 46L56 58" strokeWidth="9" />
    </g>
  ) : (
    <g transform="translate(-4 -2)">
      <g {...linea} strokeWidth="5.5">
        <path d="M19 11V47M19 11H31A9 9 0 0 1 31 29H19M19 29H34A9 9 0 0 1 34 47H19" />
        <path d="M41 45L54 57" strokeWidth="6.5" />
      </g>
      <path fill={trazo} d={ARCADA} />
    </g>
  )
}

/** Arcada de tres arcos dentro del cristal de la lupa (concepto A). */
const ARCADA =
  'M25.3 44V38.2a2.25 2.25 0 0 1 4.5 0V44ZM31 44V38.2a2.25 2.25 0 0 1 4.5 0V44ZM36.7 44V38.2a2.25 2.25 0 0 1 4.5 0V44Z'
const LIBRO =
  'M32 20C26 16 16 16 8 19V47C16 44 26 44 32 48C38 44 48 44 56 47V19C48 16 38 16 32 20Z'
const LIBRO_MINI =
  'M32 17C25 12 15 12 7 15V47C15 44 25 44 32 49C39 44 49 44 57 47V15C49 12 39 12 32 17Z'
const BF =
  'M12 8H52A2 2 0 0 1 54 10V21H10V10A2 2 0 0 1 12 8ZM16 18V15A4 4 0 0 1 24 15V18ZM28 18V15A4 4 0 0 1 36 15V18ZM40 18V15A4 4 0 0 1 48 15V18ZM10 27H22.5C27.8 27 31 29.8 31 33.8C31 36.6 29.6 38.5 27.2 39.5C30.4 40.5 32.4 43 32.4 46C32.4 49.6 29.2 52 24 52H10ZM16.5 32V37H21.8C24.2 37 25.2 35.8 25.2 34.5C25.2 33.2 24.2 32 21.8 32ZM16.5 42V47H23C25.4 47 26.4 45.9 26.4 44.5C26.4 43.1 25.4 42 23 42ZM36 27H54V32.4H42.5V36.6H51.6V41.8H42.5V52H36Z'

/**
 * Marca de producto para el pie: logo del CLENA y, en pequeño, el nombre de la
 * aplicación. Los logos son recursos de terceros usados con fines
 * académicos (ver docs/recursos-de-terceros.md).
 */
export function Marca() {
  // Sin el archivo (recurso de terceros, ver docs/recursos-de-terceros.md) el logo desaparece sin dejar imagen rota.
  const [sinLogo, setSinLogo] = useState(false)
  return (
    <span className="marca">
      {!sinLogo && (
        <img
          className="marca-logo marca-logo-clena"
          src="/Logo_Clena-white.svg"
          alt="Corporación CLENA"
          width={95}
          height={20}
          onError={() => setSinLogo(true)}
        />
      )}
      <span className="marca-textos">
        <span className="marca-nombre">Busca Fácil</span>
        <span className="marca-linea">Biblioteca del CLENA</span>
      </span>
    </span>
  )
}

/** Enlace externo con logo: pestaña nueva, `rel` seguro y un solo nombre accesible. */
function EnlaceLogo({
  href,
  nombre,
  src,
  clase,
  ancho,
  alto,
  alFallar,
}: {
  href: string
  nombre: string
  src: string
  clase: string
  /** Tamaño intrínseco: reserva el espacio antes de que cargue el archivo (sin CLS). */
  ancho: number
  alto: number
  alFallar: () => void
}) {
  return (
    <a
      className="enlace-logo"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        className={clase}
        src={src}
        alt={nombre}
        width={ancho}
        height={alto}
        onError={alFallar}
      />
      <span className="solo-lectores">, se abre en una pestaña nueva</span>
    </a>
  )
}

/**
 * Los cuatro logos de la cabecera, siempre visibles y en una sola fila:
 * Universidad del Norte (versión blanca sin fondo, aproximación a la invertida
 * del manual de marca: falta pedir el SVG oficial),
 * CLENA (amarillo original), Biblioteca Piloto del Caribe (ámbar) y el
 * logo de Busca Fácil, que lleva al inicio. Los tres
 * primeros enlazan a su sitio en una pestaña nueva; si un archivo falta, su
 * enlace desaparece sin dejar hueco ni imagen rota.
 */
export function LogosCabecera() {
  const [sinUninorte, setSinUninorte] = useState(false)
  const [sinClena, setSinClena] = useState(false)
  const [sinBiblioteca, setSinBiblioteca] = useState(false)
  return (
    <div className="cabecera-logos">
      {!sinUninorte && (
        <EnlaceLogo
          href="https://www.uninorte.edu.co/"
          nombre="Universidad del Norte"
          src="/intro/uninorte-blanco.png"
          clase="logo-uninorte"
          ancho={518}
          alto={155}
          alFallar={() => setSinUninorte(true)}
        />
      )}
      {!sinClena && (
        <EnlaceLogo
          href="https://clena.org/"
          nombre="Corporación CLENA"
          src="/intro/clena-amarillo.svg"
          clase="logo-clena"
          ancho={95}
          alto={20}
          alFallar={() => setSinClena(true)}
        />
      )}
      {!sinBiblioteca && (
        <EnlaceLogo
          href="https://www.bibliotecapilotodelcaribe.com/"
          nombre="Biblioteca Piloto del Caribe"
          src="/BPCHorizontal2.png"
          clase="logo-biblioteca"
          ancho={450}
          alto={100}
          alFallar={() => setSinBiblioteca(true)}
        />
      )}
      <Link
        to="/"
        className="enlace-logo cabecera-marca"
        aria-label="Busca Fácil, Biblioteca del CLENA: ir al inicio"
      >
        {LOGO_LLEVA_NOMBRE ? (
          <>
            {/* Compacto («BF»): niveles altos de compactación y pantallas angostas. */}
            <LogoMarca size={38} forma="simbolo" className="logo-bf logo-bf-simbolo" />
            <span className="cabecera-marca-completo">
              <LogoMarca size={34} className="logo-bf-completo" />
            </span>
          </>
        ) : (
          <>
            <LogoMarca size={32} className="logo-bf" />
            <span className="marca-textos">
              <span className="marca-nombre">Busca Fácil</span>
              <span className="marca-linea">Biblioteca del CLENA</span>
            </span>
          </>
        )}
      </Link>
    </div>
  )
}
