import { peticion } from '../../shared/api/client'

export interface DatosRegistro {
  fullName: string
  email: string
  password: string
  acceptPrivacy: boolean
}

export interface MiCuenta {
  nombre: string
  correo: string
  consentimientoEn: string | null
  versionAviso: string | null
}

/** HU-16. No abre sesión: la respuesta es la misma exista o no el correo. */
export function registrarCuenta(datos: DatosRegistro): Promise<{ registrado: boolean }> {
  return peticion<{ registrado: boolean }>('/auth/register', {
    metodo: 'POST',
    cuerpo: datos,
  })
}

export function obtenerMiCuenta(
  token: string,
  signal?: AbortSignal,
): Promise<MiCuenta> {
  return peticion<MiCuenta>('/auth/me', { token, signal })
}

/** HU-17. 403 si la contraseña no coincide; 409 si hay un préstamo activo. */
export function eliminarMiCuenta(
  contrasena: string,
  token: string,
): Promise<void> {
  return peticion<void>('/auth/me/delete', {
    metodo: 'POST',
    cuerpo: { password: contrasena },
    token,
  })
}
