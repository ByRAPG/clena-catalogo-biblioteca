import { peticion } from '../../shared/api/client'

export interface Reserva {
  id: string
  workId: string
  workTitle: string
  inventoryCode: string
  reservedAt: string
  expiresAt: string
}

/** HU-14. 409 si no hay ejemplares libres o ya la tiene reservada. */
export function reservarObra(workId: string, token: string): Promise<Reserva> {
  return peticion<Reserva>('/reservations', {
    metodo: 'POST',
    cuerpo: { workId },
    token,
  })
}

export async function listarMisReservas(
  token: string,
  signal?: AbortSignal,
): Promise<Reserva[]> {
  const respuesta = await peticion<{ data: Reserva[] }>('/reservations/mine', {
    token,
    signal,
  })
  return respuesta.data
}

export function cancelarReserva(id: string, token: string): Promise<void> {
  return peticion<void>(`/reservations/${encodeURIComponent(id)}`, {
    metodo: 'DELETE',
    token,
  })
}
