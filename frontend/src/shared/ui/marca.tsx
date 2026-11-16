import type { SVGProps } from 'react'

/**
 * Isotipo de Consulta Fácil: un libro abierto. Solo usa `currentColor`, así
 * que toma el color del texto que lo rodea (blanco sobre el encabezado y, en
 * alto contraste, el que imponga ese modo). Es decorativo: el nombre va aparte.
 */
export function Isotipo({ size = 40, ...resto }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      {...resto}
    >
      <path d="M4 10c8-3 15-2 19 2v27c-4-4-11-5-19-2z" />
      <path d="M44 10c-8-3-15-2-19 2v27c4-4 11-5 19-2z" opacity="0.72" />
      <path
        d="M30 19h8M30 25h8M30 31h6"
        stroke="var(--isotipo-trazo, #23234E)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/**
 * Marca de producto: isotipo, nombre y línea de la biblioteca. Hoy es el
 * identificador propio de Consulta Fácil; cuando lleguen los logos oficiales
 * del CLENA y de Uninorte se muestran en `CreditosInstitucionales`.
 */
export function Marca() {
  return (
    <span className="marca">
      <Isotipo className="marca-isotipo" />
      <span className="marca-textos">
        <span className="marca-nombre">Consulta Fácil</span>
        <span className="marca-linea">Biblioteca del CLENA</span>
      </span>
    </span>
  )
}
