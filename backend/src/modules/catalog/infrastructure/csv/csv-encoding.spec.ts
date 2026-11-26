import { InvalidCsvError } from '../../domain/errors/invalid-csv.error';
import { CSV_IMPORT_LIMITS } from '../../domain/value-objects/csv-limits';
import { decodeCsvContent } from './csv-encoding';

describe('decodeCsvContent', () => {
  it('decodifica UTF-8 sin BOM', () => {
    const bytes = new TextEncoder().encode('título,autor\nAño,García');

    expect(decodeCsvContent(bytes)).toBe('título,autor\nAño,García');
  });

  it('decodifica UTF-8 con BOM y elimina la marca inicial', () => {
    const body = new TextEncoder().encode('titulo,autor\nCien años,Márquez');
    const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...body]);

    expect(decodeCsvContent(withBom)).toBe('titulo,autor\nCien años,Márquez');
  });

  it('detecta y decodifica Windows-1252 con tildes, ñ y comillas latinas', () => {
    // "título;año;«España»" en Windows-1252:
    // í=0xED, ñ=0xF1, «=0xAB, »=0xBB
    const win1252 = new Uint8Array([
      0x74, 0xed, 0x74, 0x75, 0x6c, 0x6f, 0x3b, 0x61, 0xf1, 0x6f, 0x3b, 0xab,
      0x45, 0x73, 0x70, 0x61, 0xf1, 0x61, 0xbb,
    ]);

    expect(decodeCsvContent(win1252)).toBe('título;año;«España»');
  });

  it('elimina BOM en texto UTF-8', () => {
    expect(decodeCsvContent('\uFEFFtitulo,autor')).toBe('titulo,autor');
  });

  it('rechaza texto o bytes que superan 1 MB', () => {
    const overBytes = new Uint8Array(CSV_IMPORT_LIMITS.maxBytes + 1).fill(0x61);
    const overText = 'a'.repeat(CSV_IMPORT_LIMITS.maxBytes + 1);

    expect(() => decodeCsvContent(overBytes)).toThrow(InvalidCsvError);
    expect(() => decodeCsvContent(overText)).toThrow(InvalidCsvError);
  });

  it('rechaza archivos con bytes nulos o caracteres de reemplazo UTF-8', () => {
    expect(() => decodeCsvContent(new Uint8Array([0x61, 0x00, 0x62]))).toThrow(
      InvalidCsvError,
    );
    expect(() => decodeCsvContent('t\u0000itulo')).toThrow(InvalidCsvError);
    expect(() => decodeCsvContent('t\uFFFDtulo')).toThrow(InvalidCsvError);
  });
});
