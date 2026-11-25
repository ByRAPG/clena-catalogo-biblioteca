import { InvalidCsvError } from '../../domain/errors/invalid-csv.error';
import { CSV_IMPORT_LIMITS } from '../../domain/value-objects/csv-limits';

const UTF8_BOM = [0xef, 0xbb, 0xbf] as const;

/**
 * Decodifica el contenido de un archivo CSV aceptando UTF-8 (con o sin BOM) y
 * Windows-1252 (formato típico de Excel en español). Rechaza archivos que
 * superen el límite de tamaño, contengan bytes nulos o lleguen con caracteres
 * de reemplazo UTF-8 (U+FFFD).
 */
export function decodeCsvContent(input: string | Uint8Array): string {
  if (typeof input === 'string') {
    if (Buffer.byteLength(input, 'utf8') > CSV_IMPORT_LIMITS.maxBytes) {
      throw new InvalidCsvError(
        'El archivo supera el tamaño máximo permitido de 1 MB',
      );
    }

    const withoutBom = input.startsWith('\uFEFF') ? input.slice(1) : input;

    if (withoutBom.includes('\u0000')) {
      throw new InvalidCsvError(
        'El archivo contiene caracteres nulos y no parece ser un CSV válido',
      );
    }

    if (withoutBom.includes('\uFFFD')) {
      throw new InvalidCsvError(
        'La codificación del archivo no es válida; guárdelo en UTF-8 o Windows-1252',
      );
    }

    return withoutBom;
  }

  if (input.byteLength > CSV_IMPORT_LIMITS.maxBytes) {
    throw new InvalidCsvError(
      'El archivo supera el tamaño máximo permitido de 1 MB',
    );
  }

  if (input.includes(0)) {
    throw new InvalidCsvError(
      'El archivo contiene caracteres nulos y no parece ser un CSV válido',
    );
  }

  const hasUtf8Bom =
    input.byteLength >= 3 &&
    input[0] === UTF8_BOM[0] &&
    input[1] === UTF8_BOM[1] &&
    input[2] === UTF8_BOM[2];

  const payload = hasUtf8Bom ? input.subarray(3) : input;

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(payload);
  } catch {
    return new TextDecoder('windows-1252').decode(payload);
  }
}
