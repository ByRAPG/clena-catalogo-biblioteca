import { QR_PRINT_WIDTH, QrCodeLibGenerator } from './qr-code.generator';

describe('QrCodeLibGenerator', () => {
  it('devuelve un PNG válido de al menos 1024 px', async () => {
    const png = await new QrCodeLibGenerator().toPng(
      'http://localhost:5173/?sala=abc',
    );
    const firma = Buffer.from('89504e470d0a1a0a', 'hex');
    expect(png.subarray(0, 8).equals(firma)).toBe(true);
    // Ancho y alto están en el chunk IHDR (bytes 16-23).
    expect(png.readUInt32BE(16)).toBeGreaterThanOrEqual(QR_PRINT_WIDTH);
    expect(png.readUInt32BE(20)).toBeGreaterThanOrEqual(QR_PRINT_WIDTH);
  }, 60000);
});
