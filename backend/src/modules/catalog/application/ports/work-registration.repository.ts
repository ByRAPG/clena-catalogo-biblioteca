import type { NewWork } from '../../domain/entities/new-work';

export const WORK_REGISTRATION_REPOSITORY = Symbol(
  'WORK_REGISTRATION_REPOSITORY',
);

export interface RegisteredWork {
  id: string;
  title: string;
}

export interface WorkRegistrationRepository {
  categoryExists(id: string): Promise<boolean>;
  /** Guarda la obra; reutiliza autores y temas que ya existan. */
  create(work: NewWork): Promise<RegisteredWork>;
}
