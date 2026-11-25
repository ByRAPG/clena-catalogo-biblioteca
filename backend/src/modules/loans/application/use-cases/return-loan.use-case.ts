import { Inject, Injectable } from '@nestjs/common';
import { LoanNotFoundError } from '../../domain/errors/loan.errors';
import type {
  LoanRecord,
  LoanRepository,
} from '../../domain/repositories/loan.repository';
import type { LoanClock } from '../ports/clock.port';
import { LOAN_CLOCK, LOAN_REPOSITORY } from '../tokens';

/** HU-20: el personal registra la devolución de un préstamo activo. */
@Injectable()
export class ReturnLoanUseCase {
  constructor(
    @Inject(LOAN_REPOSITORY)
    private readonly loans: LoanRepository,
    @Inject(LOAN_CLOCK)
    private readonly clock: LoanClock,
  ) {}

  async execute(loanId: string): Promise<LoanRecord> {
    const existing = await this.loans.findLoanById(loanId);
    if (!existing) {
      throw new LoanNotFoundError();
    }

    const returnedAt = this.clock.now();
    existing.loan.markReturned(returnedAt);

    return this.loans.markLoanReturnedAndCopyAvailable({
      loanId: existing.loan.id,
      copyId: existing.loan.copyId,
      returnedAt,
    });
  }
}
