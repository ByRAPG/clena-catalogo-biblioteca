import { InvalidNewCopyError } from '../errors/copy.errors';
import { EDITABLE_COPY_STATUSES, type EditableCopyStatus } from './copy-update';

export const MAX_INVENTORY_CODE_LENGTH = 50;

export interface NewCopyInput {
  inventoryCode: string;
  shelfId: string;
  status?: string;
}

/**
 * Ejemplar nuevo de un libro (HU-19): código de inventario, estante y estado
 * inicial. PRESTADO no se admite: lo pone el módulo de préstamos.
 */
export class NewCopy {
  private constructor(
    public readonly inventoryCode: string,
    public readonly shelfId: string,
    public readonly status: EditableCopyStatus,
  ) {}

  static create(input: NewCopyInput): NewCopy {
    const inventoryCode = input.inventoryCode.trim();
    if (!inventoryCode) {
      throw new InvalidNewCopyError('Escriba el código de inventario');
    }
    if (inventoryCode.length > MAX_INVENTORY_CODE_LENGTH) {
      throw new InvalidNewCopyError(
        `El código de inventario admite máximo ${MAX_INVENTORY_CODE_LENGTH} caracteres`,
      );
    }
    if (/\s/.test(inventoryCode)) {
      throw new InvalidNewCopyError(
        'El código de inventario no puede tener espacios',
      );
    }
    const shelfId = input.shelfId.trim();
    if (!shelfId) throw new InvalidNewCopyError('Elija el estante');
    const status = input.status ?? 'DISPONIBLE';
    if (!(EDITABLE_COPY_STATUSES as readonly string[]).includes(status)) {
      throw new InvalidNewCopyError(
        'El estado debe ser DISPONIBLE, MANTENIMIENTO o BAJA',
      );
    }
    return new NewCopy(inventoryCode, shelfId, status as EditableCopyStatus);
  }
}
