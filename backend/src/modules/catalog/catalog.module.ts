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

@Module({
  controllers: [RoomsController],
  providers: [
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
