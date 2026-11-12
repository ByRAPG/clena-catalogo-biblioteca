import { Inject, Injectable } from '@nestjs/common';
import {
  RoomNotFoundError,
  buildRoomUrl,
  slugify,
} from '../domain/qr-destination';
import { QR_CODE_GENERATOR, QrCodeGenerator } from './ports/qr-code.generator';
import { ROOM_REPOSITORY, RoomRepository } from './ports/room.repository';
import { PUBLIC_WEB_URL } from './public-web-url';
import { QrImage } from './qr-image';

/** QR de una sala: abre el buscador con esa sala filtrada (HU-05). */
@Injectable()
export class GenerateRoomQr {
  constructor(
    @Inject(ROOM_REPOSITORY) private readonly rooms: RoomRepository,
    @Inject(QR_CODE_GENERATOR) private readonly generator: QrCodeGenerator,
    @Inject(PUBLIC_WEB_URL) private readonly publicWebUrl: string,
  ) {}

  async execute(roomId: string): Promise<QrImage> {
    const room = await this.rooms.findById(roomId);
    if (!room) throw new RoomNotFoundError(roomId);
    const png = await this.generator.toPng(
      buildRoomUrl(this.publicWebUrl, room.id),
    );
    return { png, fileName: `qr-sala-${slugify(room.name)}.png` };
  }
}
