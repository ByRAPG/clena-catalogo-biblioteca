import { Link } from 'react-router-dom'
import { useSesion } from '../features/auth/sesion-context'
import { IconoAlerta } from '../shared/ui/iconos'

/** Pantallas de 404 y 403, con el mismo marco que el resto. */
export function PaginaMensaje({
  titulo,
  detalle,
}: {
  titulo: string
  detalle: string
}) {
  const { sesion } = useSesion()
  const esPersonal = sesion?.rol === 'ADMIN' || sesion?.rol === 'STAFF'
  return (
    <section className="tarjeta-centrada" aria-labelledby="titulo-mensaje">
      <span className="insignia-icono" aria-hidden="true">
        <IconoAlerta />
      </span>
      <h1 id="titulo-mensaje" className="encabezado-titulo">
        {titulo}
      </h1>
      <p>{detalle}</p>
      <div className="acciones-mensaje">
        {esPersonal && (
          <Link to="/gestion" className="boton-enlace">
            Volver al panel de gestión
          </Link>
        )}
        <Link to="/" className="boton-enlace">
          {esPersonal ? 'Ir al catálogo' : 'Volver al catálogo'}
        </Link>
      </div>
    </section>
  )
}
