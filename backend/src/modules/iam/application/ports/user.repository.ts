import { Email } from '../../domain/email.vo';
import { User } from '../../domain/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findByEmail(email: Email): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  /** Guarda los cambios de estado de login (intentos fallidos y bloqueo). */
  save(user: User): Promise<void>;
  /** Inserta una cuenta nueva. No actualiza si el correo ya existe. */
  create(user: User): Promise<void>;
  /** Hay al menos un administrador activo y no anonimizado. */
  existsActiveAdmin(): Promise<boolean>;
}
