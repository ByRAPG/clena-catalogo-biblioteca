import type { CopyStatusDomain, Loan } from '../entities/loan.entity';
import type { NewReader } from '../entities/reader.entity';

export interface LoanCopySummary {
  readonly id: string;
  readonly inventoryCode: string;
  readonly status: CopyStatusDomain;
  readonly workId: string;
  readonly workTitle: string;
  readonly room: string;
  readonly section: string;
  readonly shelf: string;
  readonly hasActiveReservation: boolean;
}

export interface LoanReaderSummary {
  readonly id: string;
  readonly fullName: string;
  readonly documentId: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly anonymizedAt: Date | null;
}

export interface LoanRecord {
  readonly loan: Loan;
  readonly copy: {
    readonly id: string;
    readonly inventoryCode: string;
    readonly status: CopyStatusDomain;
    readonly workId: string;
    readonly workTitle: string;
    readonly room: string;
    readonly section: string;
    readonly shelf: string;
  };
  readonly reader: {
    readonly id: string;
    readonly fullName: string;
    readonly documentId: string | null;
    readonly email: string | null;
  };
  readonly staff: {
    readonly id: string;
    readonly fullName: string;
  } | null;
}

export type LoanStatusFilter = 'active' | 'returned' | 'all';

export interface ListLoansQuery {
  readonly status: LoanStatusFilter;
  readonly q?: string;
  readonly page: number;
  readonly pageSize: number;
}

export interface PaginatedLoans {
  readonly items: LoanRecord[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface CreateLoanPersistenceInput {
  readonly copyId: string;
  readonly readerId: string;
  readonly staffId: string;
  readonly loanedAt: Date;
  readonly dueAt: Date;
}

export interface ReturnLoanPersistenceInput {
  readonly loanId: string;
  readonly copyId: string;
  readonly returnedAt: Date;
}

export interface LoanRepository {
  findCopyById(id: string): Promise<LoanCopySummary | null>;
  findCopyByInventoryCode(
    inventoryCode: string,
  ): Promise<LoanCopySummary | null>;
  searchCopies(query: string, limit: number): Promise<LoanCopySummary[]>;
  findReaderById(id: string): Promise<LoanReaderSummary | null>;
  searchReaders(query: string, limit: number): Promise<LoanReaderSummary[]>;
  createReader(reader: NewReader): Promise<LoanReaderSummary>;
  findLoanById(id: string): Promise<LoanRecord | null>;
  createLoanAndMarkCopyLoaned(
    input: CreateLoanPersistenceInput,
  ): Promise<LoanRecord>;
  markLoanReturnedAndCopyAvailable(
    input: ReturnLoanPersistenceInput,
  ): Promise<LoanRecord>;
  listLoans(query: ListLoansQuery): Promise<PaginatedLoans>;
}
