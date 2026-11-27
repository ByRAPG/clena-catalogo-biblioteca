import type { DueAlertType } from '../../domain/alerts/due-alert';

export const LOAN_ALERTS_REPOSITORY = Symbol('LOAN_ALERTS_REPOSITORY');

export interface ReaderContact {
  id: string;
  fullName: string;
  email: string | null;
}

/** Préstamo activo que vence antes de un límite, con los avisos ya creados. */
export interface DueLoan {
  loanId: string;
  dueAt: Date;
  inventoryCode: string;
  workTitle: string;
  reader: ReaderContact;
  notifications: {
    type: DueAlertType;
    sentAt: Date | null;
    error: string | null;
  }[];
}

export interface PendingAvailabilityAlert {
  id: string;
  createdAt: Date;
  workId: string;
  workTitle: string;
  reader: ReaderContact;
}

export interface LoanAlertsRepository {
  findDueLoans(until: Date): Promise<DueLoan[]>;
  /**
   * Crea el aviso (préstamo, tipo). Devuelve false si ya existía: la revisión
   * puede correr varias veces sin repetir avisos (índice único en la base).
   */
  claimNotification(loanId: string, type: DueAlertType): Promise<boolean>;
  markNotificationSent(
    loanId: string,
    type: DueAlertType,
    sentAt: Date,
  ): Promise<void>;
  markNotificationFailed(
    loanId: string,
    type: DueAlertType,
    error: string,
  ): Promise<void>;

  /** Avisos pendientes cuyo libro ya tiene un ejemplar disponible sin reserva. */
  findDeliverableAvailabilityAlerts(
    workId?: string,
  ): Promise<PendingAvailabilityAlert[]>;
  /** Marca el aviso como enviado si seguía pendiente; false si otro lo tomó. */
  claimAvailabilityAlert(id: string, notifiedAt: Date): Promise<boolean>;
  /** Devuelve el aviso a pendiente si el correo falló, para reintentar. */
  releaseAvailabilityAlert(id: string): Promise<void>;
  listPendingAvailabilityAlerts(): Promise<PendingAvailabilityAlert[]>;

  findReader(readerId: string): Promise<ReaderContact | null>;
  findWork(
    workId: string,
  ): Promise<{ id: string; title: string; available: boolean } | null>;
  /** Lanza AvailabilityAlertPendingError si ya hay uno pendiente. */
  createAvailabilityAlert(
    readerId: string,
    workId: string,
  ): Promise<PendingAvailabilityAlert>;
}
