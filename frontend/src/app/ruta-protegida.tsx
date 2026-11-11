import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSesion, type Rol } from '../features/auth/sesion-context'

/**
 * Envuelve las rutas del personal. Sin sesión redirige a /ingresar y recuerda
 * de dónde venía; con sesión pero sin el rol necesario muestra 403 (HU-18).
 */
export function RutaProtegida({
  children,
  roles,
}: {
  children: ReactNode
  roles?: Rol[]
}) {
  const { sesion } = useSesion()
  const ubicacion = useLocation()

  if (sesion === null) {
    return <Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname }} />
  }

  if (roles !== undefined && !roles.includes(sesion.rol)) {
    return <Navigate to="/sin-permiso" replace />
  }

  return <>{children}</>
}
