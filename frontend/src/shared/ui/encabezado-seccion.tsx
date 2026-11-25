import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FranjaFoto, type FotoFondo, type TonoFranja } from './franja-foto'

/** Botón de regreso del encabezado: texto explícito y la ruta a la que vuelve. */
export interface Volver {
  texto: string
  to: string
}

export interface Miga {
  texto: string
  to?: string
}

/**
 * Encabezado de una pantalla de gestión: migas de pan, rótulo, título (h1) y
 * una descripción corta, con un botón de regreso opcional (`volver`) que va primero, antes de las migas. La última miga es la página actual. Es una franja a
 * todo el ancho con foto y filtro de marca (marino o granate); el texto sigue
 * alineado al contenedor central.
 */
export function EncabezadoSeccion({
  migas,
  volver,
  titulo,
  descripcion,
  rotulo,
  foto = 'pov',
  tono = 'marino',
  children,
}: {
  migas: Miga[]
  volver?: Volver
  titulo: string
  descripcion?: string
  rotulo?: string
  foto?: FotoFondo
  tono?: Exclude<TonoFranja, 'ambar'>
  children?: ReactNode
}) {
  return (
    <FranjaFoto
      as="header"
      foto={foto}
      tono={tono}
      className="hero encabezado-seccion"
    >
      <div className="zona-fila encabezado-fila">
      {volver !== undefined && (
        <Link to={volver.to} className="boton-volver">
          <span aria-hidden="true">←</span> {volver.texto}
        </Link>
      )}
      <nav aria-label="Migas de pan">
        <ol className="migas">
          {migas.map((miga, i) => {
            const ultima = i === migas.length - 1
            return (
              <li key={miga.texto}>
                {ultima || miga.to === undefined ? (
                  <span aria-current={ultima ? 'page' : undefined}>
                    {miga.texto}
                  </span>
                ) : (
                  <Link to={miga.to}>{miga.texto}</Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      {rotulo !== undefined && <p className="rotulo">{rotulo}</p>}
      <h1 className="encabezado-titulo">{titulo}</h1>
      {descripcion !== undefined && (
        <p className="encabezado-descripcion">{descripcion}</p>
      )}
      {children}
      </div>
    </FranjaFoto>
  )
}
