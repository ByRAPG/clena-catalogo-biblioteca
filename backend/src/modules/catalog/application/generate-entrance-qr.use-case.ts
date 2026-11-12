import { Inject, Injectable } from '@nestjs/common';
import { buildEntranceUrl } from '../domain/qr-destination';
import { QR_CODE_GENERATOR, QrCodeGenerator } from './ports/qr-code.generator';
import { PUBLIC_WEB_URL } from './public-web-url';
import { QrImage } from './qr-image';

/** QR general de la entrada: abre el buscador sin filtro (HU-05). */
@Injectable()
export class GenerateEntranceQr {
  constructor(
    @Inject(QR_CODE_GENERATOR) private readonly generator: QrCodeGenerator,
    @Inject(PUBLIC_WEB_URL) private readonly publicWebUrl: string,
  ) {}

  async execute(): Promise<QrImage> {
    const png = await this.generator.toPng(buildEntranceUrl(this.publicWebUrl));
    return { png, fileName: 'qr-entrada.png' };
  }
}
