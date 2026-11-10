import { createContext, useContext } from 'react'

export type Rol = 'ADMIN' | 'STAFF' | 'READER'

export interface Sesion {
  token: string
  nombre: string
  rol: Rol
}

export interface ContextoDeSesion {
  sesion: Sesion | null
  iniciarSesion: (sesion: Sesion) => void
  cerrarSesion: () => void
}

export const SesionContext = createContext<ContextoDeSesion | null>(null)

/** Lee la sesión actual. Falla pronto si falta el proveedor. */
export function useSesion(): ContextoDeSesion {
  const contexto = useContext(SesionContext)
  if (contexto === null) {
    throw new Error('useSesion debe usarse dentro de <SesionProvider>')
  }
  return contexto
}
