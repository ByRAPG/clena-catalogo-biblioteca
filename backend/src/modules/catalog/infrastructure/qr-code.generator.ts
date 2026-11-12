import { Injectable } from '@nestjs/common';
import QRCode from 'qrcode';
import { QrCodeGenerator } from '../application/ports/qr-code.generator';

/** Ancho mínimo en píxeles para imprimir sin pérdida de nitidez. */
export const QR_PRINT_WIDTH = 1024;
/** Margen de silencio en módulos (el estándar pide 4). */
export const QR_QUIET_ZONE = 4;

@Injectable()
export class QrCodeLibGenerator implements QrCodeGenerator {
  toPng(content: string): Promise<Buffer> {
    return QRCode.toBuffer(content, {
      type: 'png',
      errorCorrectionLevel: 'Q',
      margin: QR_QUIET_ZONE,
      width: QR_PRINT_WIDTH,
      color: { dark: '#000000', light: '#ffffff' },
    });
  }
}
