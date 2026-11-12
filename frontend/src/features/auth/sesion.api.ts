/**
 * Llamadas de sesión del módulo `iam` (HU-09).
 *
 * El refresh token nunca pasa por aquí: viaja en una cookie `httpOnly` con
 * ruta `/api/v1/auth`, que el navegador adjunta solo si la petición lleva
 * `credentials: 'include'` (ver `shared/api/client.ts`).
 */
import { peticion } from '../../shared/api/client'
import type { Rol } from './sesion-context'

/** Respuesta de `POST /auth/login` y `POST /auth/refresh`. */
export interface RespuestaDeSesion {
  accessToken: string
  usuario: { nombre: string; rol: Rol }
}

export function iniciarSesionEnApi(
  correo: string,
  contrasena: string,
  signal?: AbortSignal,
): Promise<RespuestaDeSesion> {
  return peticion<RespuestaDeSesion>('/auth/login', {
    metodo: 'POST',
    cuerpo: { email: correo, password: contrasena },
    signal,
  })
}

/** Renueva con la cookie. Responde 401 si no hay sesión que recuperar. */
export function renovarSesionEnApi(
  signal?: AbortSignal,
): Promise<RespuestaDeSesion> {
  return peticion<RespuestaDeSesion>('/auth/refresh', {
    metodo: 'POST',
    signal,
  })
}

/** El backend responde 204 aunque no hubiera sesión abierta. */
export function cerrarSesionEnApi(signal?: AbortSignal): Promise<void> {
  return peticion<void>('/auth/logout', { metodo: 'POST', signal })
}
