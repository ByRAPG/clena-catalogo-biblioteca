import { Module } from '@nestjs/common';
import { IamModule } from '../iam/iam.module';
import { LOAN_CLOCK, LOAN_REPOSITORY } from './application/tokens';
import { ListLoansUseCase } from './application/use-cases/list-loans.use-case';
import {
  RegisterReaderUseCase,
  SearchLoanCopiesUseCase,
  SearchReadersUseCase,
} from './application/use-cases/manage-readers.use-case';
import { RegisterLoanUseCase } from './application/use-cases/register-loan.use-case';
import { ReturnLoanUseCase } from './application/use-cases/return-loan.use-case';
import { PrismaLoanRepository } from './infrastructure/persistence/prisma-loan.repository';
import { SystemLoanClock } from './infrastructure/system-loan-clock';
import { LoansController } from './presentation/loans.controller';

@Module({
  imports: [IamModule],
  controllers: [LoansController],
  providers: [
    RegisterLoanUseCase,
    ReturnLoanUseCase,
    ListLoansUseCase,
    SearchReadersUseCase,
    RegisterReaderUseCase,
    SearchLoanCopiesUseCase,
    { provide: LOAN_REPOSITORY, useClass: PrismaLoanRepository },
    { provide: LOAN_CLOCK, useClass: SystemLoanClock },
  ],
})
export class LoansModule {}
