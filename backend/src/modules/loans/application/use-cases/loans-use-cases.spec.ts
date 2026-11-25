import { Loan } from '../../domain/entities/loan.entity';
import {
  CopyNotAvailableError,
  CopyNotFoundError,
  InvalidLoanRequestError,
  LoanAlreadyReturnedError,
  LoanNotFoundError,
  ReaderNotFoundError,
} from '../../domain/errors/loan.errors';
import type {
  LoanCopySummary,
  LoanReaderSummary,
  LoanRecord,
  LoanRepository,
} from '../../domain/repositories/loan.repository';
import type { LoanClock } from '../ports/clock.port';
import { ListLoansUseCase } from './list-loans.use-case';
import {
  RegisterReaderUseCase,
  SearchLoanCopiesUseCase,
  SearchReadersUseCase,
} from './manage-readers.use-case';
import { RegisterLoanUseCase } from './register-loan.use-case';
import { ReturnLoanUseCase } from './return-loan.use-case';

function buildCopy(overrides: Partial<LoanCopySummary> = {}): LoanCopySummary {
  return {
    id: 'copy-1',
    inventoryCode: 'CLENA-0001-1',
    status: 'DISPONIBLE',
    workId: 'work-1',
    workTitle: 'Cien años de soledad',
    room: 'Sala General',
    section: 'Literatura',
    shelf: 'E-01',
    hasActiveReservation: false,
    ...overrides,
  };
}

function buildReader(
  overrides: Partial<LoanReaderSummary> = {},
): LoanReaderSummary {
  return {
    id: 'reader-1',
    fullName: 'Lector de Demostración',
    documentId: '1001',
    email: 'lector@example.org',
    phone: null,
    anonymizedAt: null,
    ...overrides,
  };
}

function buildLoanRecord(returnedAt: Date | null = null): LoanRecord {
  const loanedAt = new Date('2026-11-25T15:00:00.000Z');
  const dueAt = new Date('2026-12-10T15:00:00.000Z');
  return {
    loan: new Loan({
      id: 'loan-1',
      copyId: 'copy-1',
      readerId: 'reader-1',
      staffId: 'staff-1',
      loanedAt,
      dueAt,
      returnedAt,
    }),
    copy: {
      id: 'copy-1',
      inventoryCode: 'CLENA-0001-1',
      status: returnedAt ? 'DISPONIBLE' : 'PRESTADO',
      workId: 'work-1',
      workTitle: 'Cien años de soledad',
      room: 'Sala General',
      section: 'Literatura',
      shelf: 'E-01',
    },
    reader: {
      id: 'reader-1',
      fullName: 'Lector de Demostración',
      documentId: '1001',
      email: 'lector@example.org',
    },
    staff: {
      id: 'staff-1',
      fullName: 'Bibliotecaria de Demostración',
    },
  };
}

function createRepoMock(): jest.Mocked<LoanRepository> {
  return {
    findCopyById: jest.fn(),
    findCopyByInventoryCode: jest.fn(),
    searchCopies: jest.fn(),
    findReaderById: jest.fn(),
    searchReaders: jest.fn(),
    createReader: jest.fn(),
    findLoanById: jest.fn(),
    createLoanAndMarkCopyLoaned: jest.fn(),
    markLoanReturnedAndCopyAvailable: jest.fn(),
    listLoans: jest.fn(),
  };
}

describe('Loans use cases (HU-20)', () => {
  const fixedNow = new Date('2026-11-25T15:00:00.000Z');
  const clock: LoanClock = { now: () => fixedNow };

  describe('RegisterLoanUseCase', () => {
    it('registra el préstamo de un ejemplar disponible por código de inventario', async () => {
      const repo = createRepoMock();
      const expected = buildLoanRecord();
      repo.findCopyByInventoryCode.mockResolvedValue(buildCopy());
      repo.findReaderById.mockResolvedValue(buildReader());
      repo.createLoanAndMarkCopyLoaned.mockResolvedValue(expected);

      const useCase = new RegisterLoanUseCase(repo, clock);
      const result = await useCase.execute({
        inventoryCode: ' CLENA-0001-1 ',
        readerId: 'reader-1',
        staffId: 'staff-1',
      });

      expect(result).toBe(expected);
      expect(repo.findCopyByInventoryCode).toHaveBeenCalledWith('CLENA-0001-1');
      expect(repo.createLoanAndMarkCopyLoaned).toHaveBeenCalledWith({
        copyId: 'copy-1',
        readerId: 'reader-1',
        staffId: 'staff-1',
        loanedAt: fixedNow,
        dueAt: new Date('2026-12-10T15:00:00.000Z'),
      });
    });

    it('registra el préstamo usando copyId y plazo personalizado', async () => {
      const repo = createRepoMock();
      repo.findCopyById.mockResolvedValue(buildCopy());
      repo.findReaderById.mockResolvedValue(buildReader());
      repo.createLoanAndMarkCopyLoaned.mockResolvedValue(buildLoanRecord());

      const useCase = new RegisterLoanUseCase(repo, clock);
      await useCase.execute({
        copyId: 'copy-1',
        readerId: 'reader-1',
        staffId: 'staff-1',
        loanDays: 7,
      });

      expect(repo.createLoanAndMarkCopyLoaned).toHaveBeenCalledWith(
        expect.objectContaining({
          dueAt: new Date('2026-12-02T15:00:00.000Z'),
        }),
      );
    });

    it('falla si no se envía copyId ni inventoryCode', async () => {
      const repo = createRepoMock();
      const useCase = new RegisterLoanUseCase(repo, clock);

      await expect(
        useCase.execute({ readerId: 'reader-1', staffId: 'staff-1' }),
      ).rejects.toThrow(InvalidLoanRequestError);
    });

    it('falla si el ejemplar no existe', async () => {
      const repo = createRepoMock();
      repo.findCopyByInventoryCode.mockResolvedValue(null);
      const useCase = new RegisterLoanUseCase(repo, clock);

      await expect(
        useCase.execute({
          inventoryCode: 'NO-EXISTE',
          readerId: 'reader-1',
          staffId: 'staff-1',
        }),
      ).rejects.toThrow(CopyNotFoundError);
    });

    it('impide prestar un ejemplar ya prestado', async () => {
      const repo = createRepoMock();
      repo.findCopyById.mockResolvedValue(buildCopy({ status: 'PRESTADO' }));
      const useCase = new RegisterLoanUseCase(repo, clock);

      await expect(
        useCase.execute({
          copyId: 'copy-1',
          readerId: 'reader-1',
          staffId: 'staff-1',
        }),
      ).rejects.toThrow(CopyNotAvailableError);
      expect(repo.createLoanAndMarkCopyLoaned).not.toHaveBeenCalled();
    });

    it('impide prestar si el lector no existe o fue anonimizado', async () => {
      const repo = createRepoMock();
      repo.findCopyById.mockResolvedValue(buildCopy());
      repo.findReaderById.mockResolvedValue(
        buildReader({ anonymizedAt: new Date('2026-11-20T00:00:00.000Z') }),
      );
      const useCase = new RegisterLoanUseCase(repo, clock);

      await expect(
        useCase.execute({
          copyId: 'copy-1',
          readerId: 'reader-1',
          staffId: 'staff-1',
        }),
      ).rejects.toThrow(ReaderNotFoundError);
    });
  });

  describe('ReturnLoanUseCase', () => {
    it('registra la devolución de un préstamo activo', async () => {
      const repo = createRepoMock();
      const active = buildLoanRecord(null);
      const returned = buildLoanRecord(fixedNow);
      repo.findLoanById.mockResolvedValue(active);
      repo.markLoanReturnedAndCopyAvailable.mockResolvedValue(returned);

      const useCase = new ReturnLoanUseCase(repo, clock);
      const result = await useCase.execute('loan-1');

      expect(result).toBe(returned);
      expect(repo.markLoanReturnedAndCopyAvailable).toHaveBeenCalledWith({
        loanId: 'loan-1',
        copyId: 'copy-1',
        returnedAt: fixedNow,
      });
    });

    it('falla si el préstamo no existe', async () => {
      const repo = createRepoMock();
      repo.findLoanById.mockResolvedValue(null);
      const useCase = new ReturnLoanUseCase(repo, clock);

      await expect(useCase.execute('loan-404')).rejects.toThrow(
        LoanNotFoundError,
      );
    });

    it('falla si el préstamo ya estaba devuelto', async () => {
      const repo = createRepoMock();
      repo.findLoanById.mockResolvedValue(
        buildLoanRecord(new Date('2026-11-24T10:00:00.000Z')),
      );
      const useCase = new ReturnLoanUseCase(repo, clock);

      await expect(useCase.execute('loan-1')).rejects.toThrow(
        LoanAlreadyReturnedError,
      );
      expect(repo.markLoanReturnedAndCopyAvailable).not.toHaveBeenCalled();
    });
  });

  describe('ListLoansUseCase & counter helpers', () => {
    it('normaliza filtros y paginación al listar préstamos', async () => {
      const repo = createRepoMock();
      repo.listLoans.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
      });
      const useCase = new ListLoansUseCase(repo);

      await useCase.execute({
        status: 'all',
        q: '  soledad  ',
        page: 0,
        pageSize: 500,
      });

      expect(repo.listLoans).toHaveBeenCalledWith({
        status: 'all',
        q: 'soledad',
        page: 1,
        pageSize: 100,
      });
    });

    it('busca lectores, crea lector de mostrador y busca ejemplares', async () => {
      const repo = createRepoMock();
      const reader = buildReader();
      const copy = buildCopy();
      repo.searchReaders.mockResolvedValue([reader]);
      repo.createReader.mockResolvedValue(reader);
      repo.searchCopies.mockResolvedValue([copy]);

      const searchReaders = new SearchReadersUseCase(repo);
      const registerReader = new RegisterReaderUseCase(repo);
      const searchCopies = new SearchLoanCopiesUseCase(repo);

      expect(await searchReaders.execute('  lector ', 100)).toEqual([reader]);
      expect(repo.searchReaders).toHaveBeenCalledWith('lector', 50);

      expect(
        await registerReader.execute({ fullName: '  Doña Carmen  ' }),
      ).toEqual(reader);
      expect(repo.createReader).toHaveBeenCalled();

      expect(await searchCopies.execute(' CLENA-0001 ', 10)).toEqual([copy]);
      expect(repo.searchCopies).toHaveBeenCalledWith('CLENA-0001', 10);
    });
  });
});
