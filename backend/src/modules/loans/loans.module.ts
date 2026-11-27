import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IamModule } from '../iam/iam.module';
import { EMAIL_SENDER } from './application/ports/email-sender.port';
import { LOAN_ALERTS_REPOSITORY } from './application/ports/loan-alerts.repository';
import { LOAN_CLOCK, LOAN_REPOSITORY } from './application/tokens';
import { ListLoanAlertsUseCase } from './application/use-cases/list-loan-alerts.use-case';
import { NotifyAvailabilityUseCase } from './application/use-cases/notify-availability.use-case';
import { RequestAvailabilityAlertUseCase } from './application/use-cases/request-availability-alert.use-case';
import { RunLoanAlertsUseCase } from './application/use-cases/run-loan-alerts.use-case';
import { LogEmailSender } from './infrastructure/email/log-email.sender';
import { SmtpEmailSender } from './infrastructure/email/smtp-email.sender';
import { PrismaLoanAlertsRepository } from './infrastructure/persistence/prisma-loan-alerts.repository';
import { LoanAlertsScheduler } from './infrastructure/scheduling/loan-alerts.scheduler';
import { LoanAlertsController } from './presentation/loan-alerts.controller';
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
  controllers: [LoansController, LoanAlertsController],
  providers: [
    RegisterLoanUseCase,
    ReturnLoanUseCase,
    ListLoansUseCase,
    SearchReadersUseCase,
    RegisterReaderUseCase,
    SearchLoanCopiesUseCase,
    { provide: LOAN_REPOSITORY, useClass: PrismaLoanRepository },
    { provide: LOAN_CLOCK, useClass: SystemLoanClock },
    // HU-21: alertas de devolución y disponibilidad.
    ListLoanAlertsUseCase,
    NotifyAvailabilityUseCase,
    RequestAvailabilityAlertUseCase,
    RunLoanAlertsUseCase,
    LoanAlertsScheduler,
    { provide: LOAN_ALERTS_REPOSITORY, useClass: PrismaLoanAlertsRepository },
    {
      provide: EMAIL_SENDER,
      inject: [ConfigService],
      // Sin SMTP_HOST (p. ej. en pruebas) el aviso solo queda en el log.
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('SMTP_HOST');
        return host
          ? new SmtpEmailSender({
              host,
              port: Number(config.get('SMTP_PORT') ?? 1025),
              from:
                config.get<string>('MAIL_FROM') ??
                'Biblioteca CLENA <no-responder@clena.example>',
            })
          : new LogEmailSender();
      },
    },
  ],
})
export class LoansModule {}
