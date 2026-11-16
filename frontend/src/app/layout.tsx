import { useState } from 'react'
import { Anchor, Button } from '@mantine/core'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { AccesibilidadProvider } from '../features/accessibility/accesibilidad-provider'
import { ControlesAccesibilidad } from '../features/accessibility/controles-accesibilidad'
import { useSesion } from '../features/auth/sesion-context'
import { CreditosInstitucionales } from '../shared/ui/creditos-institucionales'
import { Marca } from '../shared/ui/marca'
import './marco.css'
import { useTituloPagina } from './titulo-pagina'

/**
 * Marco común de las pantallas públicas: cabecera (utilidades de
 * accesibilidad, marca y navegación), contenido y pie. El enlace «Saltar al
 * contenido» es requisito de accesibilidad: aparece al tabular y lleva directo
 * al <main>. `NavLink` marca la ruta activa con `aria-current="page"`.
 */
export function Layout() {
  const { sesion, recuperando, cerrarSesion } = useSesion()
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  useTituloPagina()

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
    }
  }

  return (
    <AccesibilidadProvider>
      <Anchor href="#contenido" className="salto-al-contenido">
        Saltar al contenido
      </Anchor>

      <div className="marco">
        <header className="cabecera">
          <div className="barra-utilidades">
            <div className="marco-ancho barra-utilidades-fila">
              <ControlesAccesibilidad />
            </div>
          </div>
          <div className="marco-ancho cabecera-fila">
            <Link
              to="/"
              className="cabecera-marca"
              aria-label="Consulta Fácil, Biblioteca del CLENA: ir al inicio"
            >
              <Marca />
            </Link>
            <nav aria-label="Principal" className="navegacion">
              <NavLink to="/gestion" className="navegacion-enlace">
                Gestión
              </NavLink>
              {!recuperando && !sesion && (
                <NavLink to="/ingresar" className="navegacion-enlace">
                  Ingresar
                </NavLink>
              )}
              {sesion && (
                <Button
                  variant="white"
                  onClick={() => void salir()}
                  loading={cerrandoSesion}
                >
                  Cerrar sesión
                </Button>
              )}
            </nav>
          </div>
        </header>

        <main id="contenido" className="marco-ancho marco-contenido">
          <Outlet />
        </main>

        <footer className="pie">
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
              © {new Date().getFullYear()} Consulta Fácil · Prototipo académico
            </small>
          </div>
        </footer>
      </div>
    </AccesibilidadProvider>
  )
}
