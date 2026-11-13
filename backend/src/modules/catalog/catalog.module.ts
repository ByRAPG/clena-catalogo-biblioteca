import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateEntranceQr } from './application/generate-entrance-qr.use-case';
import { GenerateRoomQr } from './application/generate-room-qr.use-case';
import { QR_CODE_GENERATOR } from './application/ports/qr-code.generator';
import { ROOM_REPOSITORY } from './application/ports/room.repository';
import { PUBLIC_WEB_URL } from './application/public-web-url';
import { PrismaRoomRepository } from './infrastructure/prisma-room.repository';
import { QrCodeLibGenerator } from './infrastructure/qr-code.generator';
import { RoomsController } from './presentation/rooms.controller';
import { ImportCatalogUseCase } from './application/use-cases/import-catalog.use-case';
import { GetImportTemplateUseCase } from './application/use-cases/get-import-template.use-case';
import {
  CATALOG_CSV_READER,
  CATALOG_IMPORT_REPOSITORY,
  IMPORT_AUTHENTICATOR,
  IMPORT_JOB_REPOSITORY,
  IMPORT_TEMPLATE_READER,
} from './application/tokens';
import { CatalogCsvReader } from './infrastructure/csv/catalog-csv.reader';
import { FileImportTemplateReader } from './infrastructure/csv/file-import-template.reader';
import { PrismaCatalogImportRepository } from './infrastructure/persistence/prisma-catalog-import.repository';
import { PrismaImportJobRepository } from './infrastructure/persistence/prisma-import-job.repository';
import { IamImportAuthenticator } from './infrastructure/security/iam-import.authenticator';
import { IamModule } from '../iam/iam.module';
import { ImportCatalogController } from './presentation/import-catalog.controller';
import { ImportAdminGuard } from './presentation/guards/import-admin.guard';
import { RegisterWorkUseCase } from './application/use-cases/register-work.use-case';
import { SuggestCatalogTermsUseCase } from './application/use-cases/suggest-catalog-terms.use-case';
import { WORK_REGISTRATION_REPOSITORY } from './application/ports/work-registration.repository';
import { CATALOG_TERM_REPOSITORY } from './application/ports/catalog-term.repository';
import { PrismaWorkRegistrationRepository } from './infrastructure/persistence/prisma-work-registration.repository';
import { PrismaCatalogTermRepository } from './infrastructure/persistence/prisma-catalog-term.repository';
import { CatalogWorksController } from './presentation/catalog-works.controller';

@Module({
  imports: [IamModule],
  controllers: [
    RoomsController,
    ImportCatalogController,
    CatalogWorksController,
  ],
  providers: [
    ImportCatalogUseCase,
    GetImportTemplateUseCase,
    ImportAdminGuard,
    { provide: CATALOG_CSV_READER, useClass: CatalogCsvReader },
    {
      provide: CATALOG_IMPORT_REPOSITORY,
      useClass: PrismaCatalogImportRepository,
    },
    { provide: IMPORT_JOB_REPOSITORY, useClass: PrismaImportJobRepository },
    { provide: IMPORT_TEMPLATE_READER, useClass: FileImportTemplateReader },
    { provide: IMPORT_AUTHENTICATOR, useClass: IamImportAuthenticator },
    RegisterWorkUseCase,
    SuggestCatalogTermsUseCase,
    {
      provide: WORK_REGISTRATION_REPOSITORY,
      useClass: PrismaWorkRegistrationRepository,
    },
    { provide: CATALOG_TERM_REPOSITORY, useClass: PrismaCatalogTermRepository },
    GenerateRoomQr,
    GenerateEntranceQr,
    { provide: ROOM_REPOSITORY, useClass: PrismaRoomRepository },
    { provide: QR_CODE_GENERATOR, useClass: QrCodeLibGenerator },
    {
      provide: PUBLIC_WEB_URL,
      inject: [ConfigService],
      useFactory: (config: ConfigService): string =>
        config.get<string>('PUBLIC_WEB_URL') ?? 'http://localhost:5173',
    },
  ],
})
export class CatalogModule {}
