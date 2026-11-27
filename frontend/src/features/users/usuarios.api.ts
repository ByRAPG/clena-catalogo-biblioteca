import { peticion } from '../../shared/api/client'
import type { Rol } from '../auth/sesion-context'

export interface CuentaPersonal {
  id: string
  fullName: string
  email: string
  role: Rol
  active: boolean
  createdAt: string
}

export interface DatosCuentaNueva {
  fullName: string
  email: string
  password: string
}

export async function listarCuentas(
  token: string,
  signal?: AbortSignal,
): Promise<CuentaPersonal[]> {
  const respuesta = await peticion<{ data: CuentaPersonal[] }>('/users', {
    token,
    signal,
  })
  return respuesta.data
}

export function crearCuenta(
  datos: DatosCuentaNueva,
  token: string,
): Promise<{ id: string }> {
  return peticion<{ id: string }>('/users', {
    metodo: 'POST',
    cuerpo: datos,
    token,
  })
}

export function cambiarEstadoCuenta(
  id: string,
  active: boolean,
  token: string,
): Promise<void> {
  return peticion<void>(`/users/${encodeURIComponent(id)}`, {
    metodo: 'PATCH',
    cuerpo: { active },
    token,
  })
}
