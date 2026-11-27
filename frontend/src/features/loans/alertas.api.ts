import { peticion } from '../../shared/api/client'

export type TipoAlerta = 'VENCIDO' | 'POR_VENCER'

export interface AlertaPrestamo {
  loanId: string
  type: TipoAlerta
  dueAt: string
  inventoryCode: string
  workTitle: string
  readerName: string
  readerEmail: string | null
  notifiedAt: string | null
  notifyError: string | null
}

export interface AvisoDisponibilidad {
  id: string
  createdAt: string
  workId: string
  workTitle: string
  readerName: string
  readerEmail: string | null
}

export interface PanelAlertas {
  loans: AlertaPrestamo[]
  availability: AvisoDisponibilidad[]
}

export interface ResumenRevision {
  reminders: {
    sent: number
    failed: number
    withoutEmail: number
    alreadySent: number
  }
  availability: { sent: number; failed: number }
}

/** `GET /loans/alerts` (HU-21): vencidos primero, luego por vencer. */
export function obtenerAlertas(
  token: string,
  signal?: AbortSignal,
): Promise<PanelAlertas> {
  return peticion<PanelAlertas>('/loans/alerts', { token, signal })
}

/** `POST /loans/alerts/run`: la misma revisión diaria, sin repetir avisos. */
export function correrRevision(token: string): Promise<ResumenRevision> {
  return peticion<ResumenRevision>('/loans/alerts/run', {
    metodo: 'POST',
    token,
  })
}

/** `POST /loans/availability-alerts`: «Avísame cuando esté disponible». */
export function pedirAvisoDisponibilidad(
  readerId: string,
  workId: string,
  token: string,
): Promise<AvisoDisponibilidad> {
  return peticion<AvisoDisponibilidad>('/loans/availability-alerts', {
    metodo: 'POST',
    cuerpo: { readerId, workId },
    token,
  })
}
