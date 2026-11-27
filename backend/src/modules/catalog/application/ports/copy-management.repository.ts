import type { NewCopy } from '../../domain/entities/new-copy';
import type {
  CopyCirculation,
  CopyStatus,
  EditableCopyStatus,
} from '../../domain/entities/copy-update';

export const COPY_MANAGEMENT_REPOSITORY = Symbol('COPY_MANAGEMENT_REPOSITORY');

/** Ejemplar con su ubicación completa: estante › sección › sala. */
export interface CopyView {
  id: string;
  inventoryCode: string;
  status: CopyStatus;
  shelfId: string;
  shelf: string;
  section: string;
  room: string;
}

export interface ShelfOption {
  id: string;
  code: string;
  section: string;
  room: string;
}

export interface CopyChanges {
  shelfId?: string;
  status?: EditableCopyStatus;
}

export interface CopyManagementRepository {
  findCirculation(copyId: string): Promise<CopyCirculation | null>;
  shelfExists(shelfId: string): Promise<boolean>;
  update(copyId: string, changes: CopyChanges): Promise<CopyView>;
  /** Estantes ordenados por sala, sección y código. */
  listShelves(): Promise<ShelfOption[]>;
  /** HU-19: la obra existe y no está eliminada. */
  workExists(workId: string): Promise<boolean>;
  inventoryCodeExists(inventoryCode: string): Promise<boolean>;
  /** HU-19: lanza InventoryCodeTakenError si el código se registró a la vez. */
  create(workId: string, copy: NewCopy): Promise<CopyView>;
}
