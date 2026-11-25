import { Inject, Injectable } from '@nestjs/common';
import {
  NewReader,
  type NewReaderInput,
} from '../../domain/entities/reader.entity';
import type {
  LoanCopySummary,
  LoanReaderSummary,
  LoanRepository,
} from '../../domain/repositories/loan.repository';
import { LOAN_REPOSITORY } from '../tokens';

const DEFAULT_SEARCH_LIMIT = 20;
const MAX_SEARCH_LIMIT = 50;

/** Busca lectores activos por nombre, documento o correo para el mostrador. */
@Injectable()
export class SearchReadersUseCase {
  constructor(
    @Inject(LOAN_REPOSITORY)
    private readonly loans: LoanRepository,
  ) {}

  execute(
    query = '',
    limit = DEFAULT_SEARCH_LIMIT,
  ): Promise<LoanReaderSummary[]> {
    const safeLimit = Math.min(
      MAX_SEARCH_LIMIT,
      Math.max(1, Math.trunc(limit)),
    );
    return this.loans.searchReaders(query.trim(), safeLimit);
  }
}

/** Registra un lector de mostrador (sin cuenta de usuario) para préstamos. */
@Injectable()
export class RegisterReaderUseCase {
  constructor(
    @Inject(LOAN_REPOSITORY)
    private readonly loans: LoanRepository,
  ) {}

  execute(input: NewReaderInput): Promise<LoanReaderSummary> {
    const reader = NewReader.create(input);
    return this.loans.createReader(reader);
  }
}

/** Busca ejemplares por código de inventario o título de obra para prestarlos. */
@Injectable()
export class SearchLoanCopiesUseCase {
  constructor(
    @Inject(LOAN_REPOSITORY)
    private readonly loans: LoanRepository,
  ) {}

  execute(
    query = '',
    limit = DEFAULT_SEARCH_LIMIT,
  ): Promise<LoanCopySummary[]> {
    const safeLimit = Math.min(
      MAX_SEARCH_LIMIT,
      Math.max(1, Math.trunc(limit)),
    );
    return this.loans.searchCopies(query.trim(), safeLimit);
  }
}
