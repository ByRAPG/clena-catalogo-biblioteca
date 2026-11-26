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
}
