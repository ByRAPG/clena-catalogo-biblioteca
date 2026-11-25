import { Inject, Injectable } from '@nestjs/common';
import {
  DEFAULT_LOAN_DAYS,
  assertCopyCanBeLoaned,
  calculateDueDate,
} from '../../domain/entities/loan.entity';
import {
  CopyNotFoundError,
  InvalidLoanRequestError,
  ReaderNotFoundError,
} from '../../domain/errors/loan.errors';
import type {
  LoanRecord,
  LoanRepository,
} from '../../domain/repositories/loan.repository';
import type { LoanClock } from '../ports/clock.port';
import { LOAN_CLOCK, LOAN_REPOSITORY } from '../tokens';

export interface RegisterLoanInput {
  readonly copyId?: string;
  readonly inventoryCode?: string;
  readonly readerId: string;
  readonly staffId: string;
  readonly loanDays?: number;
}

/** HU-20: el personal registra un préstamo de un ejemplar disponible a un lector. */
@Injectable()
export class RegisterLoanUseCase {
  constructor(
    @Inject(LOAN_REPOSITORY)
    private readonly loans: LoanRepository,
    @Inject(LOAN_CLOCK)
    private readonly clock: LoanClock,
  ) {}

  async execute(input: RegisterLoanInput): Promise<LoanRecord> {
    const loanedAt = this.clock.now();
    const dueAt = calculateDueDate(
      loanedAt,
      input.loanDays ?? DEFAULT_LOAN_DAYS,
    );

    const copyId = input.copyId?.trim();
    const inventoryCode = input.inventoryCode?.trim();
    if (!copyId && !inventoryCode) {
      throw new InvalidLoanRequestError(
        'Debe indicar el ejemplar (copyId o código de inventario)',
      );
    }

    const copy = copyId
      ? await this.loans.findCopyById(copyId)
      : await this.loans.findCopyByInventoryCode(inventoryCode!);

    if (!copy) {
      throw new CopyNotFoundError(inventoryCode ?? copyId);
    }

    assertCopyCanBeLoaned(copy.status, copy.hasActiveReservation);

    const reader = await this.loans.findReaderById(input.readerId);
    if (!reader || reader.anonymizedAt !== null) {
      throw new ReaderNotFoundError();
    }

    return this.loans.createLoanAndMarkCopyLoaned({
      copyId: copy.id,
      readerId: reader.id,
      staffId: input.staffId,
      loanedAt,
      dueAt,
    });
  }
}
