export type CopyStatus = 'DISPONIBLE' | 'PRESTADO' | 'MANTENIMIENTO' | 'BAJA';

export type MatchedOn = 'title' | 'author' | 'subject';

export type AvailabilityStatus = 'DISPONIBLE' | 'NO_DISPONIBLE';
export type UnavailableReason = 'PRESTADO' | 'MANTENIMIENTO' | 'SIN_EJEMPLARES';

export interface Location {
  room: string;
  section: string;
  shelf: string;
}

export interface Availability {
  status: AvailabilityStatus;
  reason: UnavailableReason | null;
  availableCopies: number;
  totalCopies: number;
  hasDigital: boolean;
}

export interface CategoryRef {
  id: string;
  name: string;
}

/** Ejemplar tal como lo ve la búsqueda (puede estar dado de baja). */
export interface CopyRecord {
  inventoryCode: string;
  status: CopyStatus;
  location: Location;
}

export interface WorkSummary {
  id: string;
  title: string;
  authors: string[];
  subjects: string[];
  category: CategoryRef | null;
  year: number | null;
  matchedOn: MatchedOn | null;
  availability: Availability;
  location: Location | null;
}

export type VisibleCopyStatus = Exclude<CopyStatus, 'BAJA'>;

export interface WorkDetailCopy {
  inventoryCode: string;
  status: VisibleCopyStatus;
  room: string;
  section: string;
  shelf: string;
}

export interface WorkDetail extends WorkSummary {
  subtitle: string | null;
  publisher: string | null;
  isbn: string | null;
  classification: string | null;
  digitalUrl: string | null;
  copies: WorkDetailCopy[];
}
