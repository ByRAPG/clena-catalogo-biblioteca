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
import { PendingIamAuthenticator } from './infrastructure/security/pending-iam.authenticator';
import { ImportCatalogController } from './presentation/import-catalog.controller';
import { ImportAdminGuard } from './presentation/guards/import-admin.guard';

@Module({
  controllers: [RoomsController, ImportCatalogController],
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
    { provide: IMPORT_AUTHENTICATOR, useClass: PendingIamAuthenticator },
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
