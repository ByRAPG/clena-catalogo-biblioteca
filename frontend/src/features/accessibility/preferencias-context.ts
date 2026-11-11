import { createContext, useContext } from 'react'
import type { Preferencias } from './preferencias'

export interface ContextoDeAccesibilidad {
  preferencias: Preferencias
  alternarLetraGrande: () => void
  alternarAltoContraste: () => void
}

export const AccesibilidadContext =
  createContext<ContextoDeAccesibilidad | null>(null)

/** Lee las preferencias. Falla pronto si falta el proveedor. */
export function useAccesibilidad(): ContextoDeAccesibilidad {
  const contexto = useContext(AccesibilidadContext)
  if (contexto === null) {
    throw new Error(
      'useAccesibilidad debe usarse dentro de <AccesibilidadProvider>',
    )
  }
  return contexto
}
