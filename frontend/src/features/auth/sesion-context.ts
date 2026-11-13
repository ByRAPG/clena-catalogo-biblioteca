import { createContext, useContext } from 'react'

export type Rol = 'ADMIN' | 'STAFF' | 'READER'

/**
 * Sesión del personal. El `token` es el access token y vive **solo en
 * memoria** (ADR-03): no se escribe en `localStorage` ni en `sessionStorage`,
 * así que una pestaña nueva o un reinicio del navegador no lo heredan.
 */
export interface Sesion {
  token: string
  nombre: string
  rol: Rol
}

export interface ContextoDeSesion {
  sesion: Sesion | null
  /**
   * `true` mientras se intenta recuperar la sesión con la cookie al cargar la
   * página. Quien proteja una ruta debe esperar: si redirige antes de que
   * termine, echa fuera a alguien que sí tiene sesión válida.
   */
  recuperando: boolean
  /** Lanza `ApiError` si las credenciales no sirven (401) o hay bloqueo (429). */
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>
  cerrarSesion: () => Promise<void>
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
