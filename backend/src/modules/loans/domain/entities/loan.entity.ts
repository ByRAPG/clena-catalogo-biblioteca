import {
  CopyNotAvailableError,
  InvalidLoanDurationError,
  LoanAlreadyReturnedError,
} from '../errors/loan.errors';

export type CopyStatusDomain =
  'DISPONIBLE' | 'PRESTADO' | 'MANTENIMIENTO' | 'BAJA';

export const DEFAULT_LOAN_DAYS = 15;
export const MIN_LOAN_DAYS = 1;
export const MAX_LOAN_DAYS = 60;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface LoanProps {
  readonly id: string;
  readonly copyId: string;
  readonly readerId: string;
  readonly staffId: string | null;
  readonly loanedAt: Date;
  readonly dueAt: Date;
  readonly returnedAt: Date | null;
}

/**
 * Calcula la fecha límite de devolución sumando `loanDays` días calendario
 * a partir de `loanedAt` sin mutar la fecha original.
 */
export function calculateDueDate(
  loanedAt: Date,
  loanDays: number = DEFAULT_LOAN_DAYS,
): Date {
  if (
    !Number.isInteger(loanDays) ||
    loanDays < MIN_LOAN_DAYS ||
    loanDays > MAX_LOAN_DAYS
  ) {
    throw new InvalidLoanDurationError(MIN_LOAN_DAYS, MAX_LOAN_DAYS);
  }
  return new Date(loanedAt.getTime() + loanDays * MS_PER_DAY);
}

/** Verifica que un ejemplar pueda prestarse según su estado y reservas. */
export function assertCopyCanBeLoaned(
  status: CopyStatusDomain,
  hasActiveReservation = false,
): void {
  if (status !== 'DISPONIBLE') {
    throw new CopyNotAvailableError(status);
  }
  if (hasActiveReservation) {
    throw new CopyNotAvailableError('RESERVADO');
  }
}

/** Entidad de dominio para un préstamo de ejemplar (HU-20, reglas R-01 y R-02). */
export class Loan {
  readonly id: string;
  readonly copyId: string;
  readonly readerId: string;
  readonly staffId: string | null;
  readonly loanedAt: Date;
  readonly dueAt: Date;
  readonly returnedAt: Date | null;

  constructor(props: LoanProps) {
    this.id = props.id;
    this.copyId = props.copyId;
    this.readerId = props.readerId;
    this.staffId = props.staffId;
    this.loanedAt = new Date(props.loanedAt.getTime());
    this.dueAt = new Date(props.dueAt.getTime());
    this.returnedAt = props.returnedAt
      ? new Date(props.returnedAt.getTime())
      : null;
  }

  isActive(): boolean {
    return this.returnedAt === null;
  }

  isOverdueAt(now: Date): boolean {
    return this.isActive() && now.getTime() > this.dueAt.getTime();
  }

  /** Devuelve una nueva instancia marcada como devuelta o falla si ya lo estaba. */
  markReturned(returnedAt: Date): Loan {
    if (!this.isActive()) {
      throw new LoanAlreadyReturnedError();
    }
    return new Loan({
      id: this.id,
      copyId: this.copyId,
      readerId: this.readerId,
      staffId: this.staffId,
      loanedAt: this.loanedAt,
      dueAt: this.dueAt,
      returnedAt,
    });
  }
}
