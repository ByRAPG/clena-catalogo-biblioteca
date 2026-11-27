import { Component, type ErrorInfo, type ReactNode } from 'react'
import { IconoAlerta } from './iconos'

interface Props {
  children: ReactNode
}

/**
 * Límite de errores para el contenido de carga diferida: si falla la descarga
 * de un fragmento (red caída, despliegue nuevo), muestra un mensaje accesible
 * con un botón para recargar, sin tumbar la cabecera ni el pie.
 */
export class LimiteErrores extends Component<Props, { fallo: boolean }> {
  state = { fallo: false }

  static getDerivedStateFromError() {
    return { fallo: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Fallo al mostrar la sección', error, info.componentStack)
  }

  render() {
    if (!this.state.fallo) return this.props.children
    return (
      <section className="tarjeta-centrada" role="alert" aria-labelledby="titulo-error-carga">
        <span className="insignia-icono" aria-hidden="true">
          <IconoAlerta />
        </span>
        <h1 id="titulo-error-carga" className="encabezado-titulo">
          No se pudo cargar esta sección
        </h1>
        <p>Revise su conexión e intente de nuevo.</p>
        <div className="acciones-mensaje">
          <button type="button" className="boton-enlace" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      </section>
    )
  }
}
