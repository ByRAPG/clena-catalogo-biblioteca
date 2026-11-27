/** HU-21: aviso de préstamo por vencer (menos de 48 h) o vencido. */
export type DueAlertType = 'POR_VENCER' | 'VENCIDO';

export const DUE_SOON_HOURS = 48;
const HOUR_MS = 3_600_000;

/** Fecha límite hasta la que un préstamo activo entra en la revisión. */
export function dueSoonLimit(now: Date): Date {
  return new Date(now.getTime() + DUE_SOON_HOURS * HOUR_MS);
}

/**
 * Tipo de aviso para un préstamo activo, o null si todavía no toca.
 * Vencido si la fecha límite ya pasó; por vencer si faltan menos de 48 h.
 */
export function classifyDueDate(dueAt: Date, now: Date): DueAlertType | null {
  if (dueAt.getTime() < now.getTime()) return 'VENCIDO';
  if (dueAt.getTime() < dueSoonLimit(now).getTime()) return 'POR_VENCER';
  return null;
}

/** Orden del panel: primero los vencidos y, dentro de cada grupo, el más urgente. */
export function compareDueAlerts(
  a: { type: DueAlertType; dueAt: Date },
  b: { type: DueAlertType; dueAt: Date },
): number {
  if (a.type !== b.type) return a.type === 'VENCIDO' ? -1 : 1;
  return a.dueAt.getTime() - b.dueAt.getTime();
}
