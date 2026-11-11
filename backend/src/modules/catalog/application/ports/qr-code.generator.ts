export const QR_CODE_GENERATOR = Symbol('QR_CODE_GENERATOR');

export interface QrCodeGenerator {
  /** Genera un PNG apto para impresión que codifica `content`. */
  toPng(content: string): Promise<Buffer>;
}
