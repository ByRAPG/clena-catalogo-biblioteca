import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type TonoCuadro = 'azul' | 'granate'

interface Props {
  numero: string
  icono: ReactNode
  titulo: string
  descripcion: string
  tono: TonoCuadro
  /** Ruta interna (se usa `Link`). */
  to?: string
  /** Ancla dentro de la misma página. */
  href?: string
  /** Acción en vez de enlace. */
  onClick?: () => void
}

/**
 * Cuadro de marca: rejilla de accesos como la del sitio de la biblioteca.
 * Alterna azul marino y granate; al pasar el cursor o enfocarlo, el color se
 * ilumina hacia el otro color de marca. Texto blanco: sobre #23234E 14,77:1 y
 * sobre #5B113C 13,21:1. El número y el icono son decorativos.
 */
export function CuadroMarca({
  numero,
  icono,
  titulo,
  descripcion,
  tono,
  to,
  href,
  onClick,
}: Props) {
  const className = `cuadro cuadro-${tono}`
  const contenido = (
    <>
      <span className="cuadro-cabecera">
        <span className="cuadro-numero" aria-hidden="true">
          {numero}
        </span>
        <span className="cuadro-icono" aria-hidden="true">
          {icono}
        </span>
      </span>
      <span className="cuadro-titulo">{titulo}</span>
      <span className="cuadro-descripcion">{descripcion}</span>
    </>
  )

  if (to !== undefined) {
    return (
      <Link to={to} className={className}>
        {contenido}
      </Link>
    )
  }
  if (href !== undefined) {
    return (
      <a href={href} className={className}>
        {contenido}
      </a>
    )
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      {contenido}
    </button>
  )
}

/** Rejilla que alterna los tonos de los cuadros que recibe. */
export function RejillaCuadros({
  etiqueta,
  children,
}: {
  etiqueta: string
  children: ReactNode
}) {
  return (
    <div className="rejilla-cuadros" role="group" aria-label={etiqueta}>
      {children}
    </div>
  )
}
