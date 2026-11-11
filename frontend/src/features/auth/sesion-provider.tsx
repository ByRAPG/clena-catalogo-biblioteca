import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { SesionContext, type Sesion } from './sesion-context'

const CLAVE = 'clena.sesion'

/**
 * Guarda la sesión en `sessionStorage` (no en `localStorage`): se borra al
 * cerrar la pestaña, que es lo deseable en los computadores compartidos de la
 * sala. El inicio de sesión real llega con HU-09; aquí queda el mecanismo.
 */
function leerSesionGuardada(): Sesion | null {
  if (typeof sessionStorage === 'undefined') return null
  const guardada = sessionStorage.getItem(CLAVE)
  if (guardada === null) return null
  try {
    return JSON.parse(guardada) as Sesion
  } catch {
    sessionStorage.removeItem(CLAVE)
    return null
  }
}

export function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(leerSesionGuardada)

  const iniciarSesion = useCallback((nueva: Sesion) => {
    setSesion(nueva)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(CLAVE, JSON.stringify(nueva))
    }
  }, [])

  const cerrarSesion = useCallback(() => {
    setSesion(null)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(CLAVE)
    }
  }, [])

  const valor = useMemo(
    () => ({ sesion, iniciarSesion, cerrarSesion }),
    [sesion, iniciarSesion, cerrarSesion],
  )

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
}
