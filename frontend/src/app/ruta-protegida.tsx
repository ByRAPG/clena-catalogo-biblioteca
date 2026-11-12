import { Group, Loader, Text } from '@mantine/core'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSesion, type Rol } from '../features/auth/sesion-context'

/**
 * Envuelve las rutas del personal. Sin sesión redirige a /ingresar y recuerda
 * de dónde venía; con sesión pero sin el rol necesario muestra 403 (HU-18).
 *
 * Mientras se recupera la sesión con la cookie no se decide nada: desde que el
 * token vive solo en memoria (ADR-03), al recargar /gestion la sesión empieza
 * en `null` y se restaura un instante después. Redirigir en ese hueco sacaría
 * a alguien que sí tiene permiso.
 *
 * Esto no es seguridad: cualquiera puede cambiar el estado desde las
 * herramientas del navegador. La autorización real la hace el backend al
 * validar el JWT en cada petición; aquí solo se evita mostrar una pantalla
 * que no se va a poder usar.
 */
export function RutaProtegida({
  children,
  roles,
}: {
  children: ReactNode
  roles?: Rol[]
}) {
  const { sesion, recuperando } = useSesion()
  const ubicacion = useLocation()

  if (recuperando) {
    return (
      <Group gap="sm" aria-live="polite">
        <Loader size="sm" />
        <Text>Comprobando su sesión…</Text>
      </Group>
    )
  }

  if (sesion === null) {
    return (
      <Navigate
        to="/ingresar"
        replace
        state={{ desde: `${ubicacion.pathname}${ubicacion.search}` }}
      />
    )
  }

  if (roles !== undefined && !roles.includes(sesion.rol)) {
    return <Navigate to="/sin-permiso" replace />
  }

  return <>{children}</>
}
