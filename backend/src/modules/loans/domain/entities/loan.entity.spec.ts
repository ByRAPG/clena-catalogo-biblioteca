import {
  DEFAULT_LOAN_DAYS,
  Loan,
  assertCopyCanBeLoaned,
  calculateDueDate,
} from './loan.entity';
import {
  CopyNotAvailableError,
  InvalidLoanDurationError,
  LoanAlreadyReturnedError,
} from '../errors/loan.errors';

describe('Loan domain entity', () => {
  const loanedAt = new Date('2026-11-25T15:00:00.000Z');
  const dueAt = new Date('2026-12-10T15:00:00.000Z');

  describe('calculateDueDate', () => {
    it('calcula la fecha límite usando el plazo por defecto (15 días)', () => {
      const result = calculateDueDate(loanedAt);
      expect(result.toISOString()).toBe('2026-12-10T15:00:00.000Z');
      expect(DEFAULT_LOAN_DAYS).toBe(15);
      // No muta la fecha original.
      expect(loanedAt.toISOString()).toBe('2026-11-25T15:00:00.000Z');
    });

    it('permite personalizar el plazo dentro del rango válido (1..60)', () => {
      expect(calculateDueDate(loanedAt, 1).toISOString()).toBe(
        '2026-11-26T15:00:00.000Z',
      );
      expect(calculateDueDate(loanedAt, 30).toISOString()).toBe(
        '2026-12-25T15:00:00.000Z',
      );
    });

    it('rechaza plazos inválidos (0, negativos, decimales o mayores a 60)', () => {
      expect(() => calculateDueDate(loanedAt, 0)).toThrow(
        InvalidLoanDurationError,
      );
      expect(() => calculateDueDate(loanedAt, -5)).toThrow(
        InvalidLoanDurationError,
      );
      expect(() => calculateDueDate(loanedAt, 7.5)).toThrow(
        InvalidLoanDurationError,
      );
      expect(() => calculateDueDate(loanedAt, 61)).toThrow(
        InvalidLoanDurationError,
      );
    });
  });

  describe('assertCopyCanBeLoaned', () => {
    it('permite prestar un ejemplar DISPONIBLE sin reserva activa', () => {
      expect(() => assertCopyCanBeLoaned('DISPONIBLE', false)).not.toThrow();
    });

    it('impide prestar un ejemplar PRESTADO con mensaje claro', () => {
      expect(() => assertCopyCanBeLoaned('PRESTADO')).toThrow(
        new CopyNotAvailableError('PRESTADO'),
      );
    });

    it('impide prestar un ejemplar en MANTENIMIENTO o BAJA', () => {
      expect(() => assertCopyCanBeLoaned('MANTENIMIENTO')).toThrow(
        CopyNotAvailableError,
      );
      expect(() => assertCopyCanBeLoaned('BAJA')).toThrow(
        CopyNotAvailableError,
      );
    });

    it('impide prestar un ejemplar DISPONIBLE que tiene reserva activa', () => {
      expect(() => assertCopyCanBeLoaned('DISPONIBLE', true)).toThrow(
        new CopyNotAvailableError('RESERVADO'),
      );
    });
  });

  describe('Loan lifecycle', () => {
    const activeLoan = new Loan({
      id: 'loan-1',
      copyId: 'copy-1',
      readerId: 'reader-1',
      staffId: 'staff-1',
      loanedAt,
      dueAt,
      returnedAt: null,
    });

    it('identifica préstamo activo y si está vencido en una fecha dada', () => {
      expect(activeLoan.isActive()).toBe(true);
      expect(activeLoan.isOverdueAt(new Date('2026-12-10T15:00:00.000Z'))).toBe(
        false,
      );
      expect(activeLoan.isOverdueAt(new Date('2026-12-10T15:00:01.000Z'))).toBe(
        true,
      );
    });

    it('marca un préstamo activo como devuelto y rechaza una segunda devolución', () => {
      const returnedAt = new Date('2026-12-01T12:00:00.000Z');
      const returned = activeLoan.markReturned(returnedAt);

      expect(returned.isActive()).toBe(false);
      expect(returned.returnedAt?.toISOString()).toBe(returnedAt.toISOString());
      expect(returned.isOverdueAt(new Date('2026-12-20T00:00:00.000Z'))).toBe(
        false,
      );
      expect(() => returned.markReturned(new Date())).toThrow(
        LoanAlreadyReturnedError,
      );
    });
  });
});
