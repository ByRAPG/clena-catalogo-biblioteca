import { Inject, Injectable } from '@nestjs/common';
import type {
  LoanRepository,
  LoanStatusFilter,
  PaginatedLoans,
} from '../../domain/repositories/loan.repository';
import { LOAN_REPOSITORY } from '../tokens';

export interface ListLoansInput {
  readonly status?: LoanStatusFilter;
  readonly q?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/** HU-20: listar préstamos activos, devueltos o históricos para el personal. */
@Injectable()
export class ListLoansUseCase {
  constructor(
    @Inject(LOAN_REPOSITORY)
    private readonly loans: LoanRepository,
  ) {}

  execute(input: ListLoansInput = {}): Promise<PaginatedLoans> {
    const status: LoanStatusFilter = input.status ?? 'active';
    const page = Math.max(1, Math.trunc(input.page ?? 1));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.trunc(input.pageSize ?? DEFAULT_PAGE_SIZE)),
    );
    const trimmedQuery = input.q?.trim();

    return this.loans.listLoans({
      status,
      q: trimmedQuery && trimmedQuery.length > 0 ? trimmedQuery : undefined,
      page,
      pageSize,
    });
  }
}
