import { Email } from '../../domain/email.vo';
import { User } from '../../domain/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findByEmail(email: Email): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  /** Guarda los cambios de estado de login (ingreso correcto: reinicia intentos). */
  save(user: User): Promise<void>;
  /**
   * Suma un intento fallido **de forma atómica** en la base de datos y devuelve
   * el contador resultante. Dos fallos simultáneos no pueden contarse como uno.
   */
  incrementFailedLogins(userId: string): Promise<number>;
  /** Bloquea la cuenta hasta `until` y reinicia el contador de intentos. */
  lockAccount(userId: string, until: Date): Promise<void>;
  /** Inserta una cuenta nueva. No actualiza si el correo ya existe. */
  create(user: User): Promise<void>;
  /** Hay al menos un administrador activo y no anonimizado. */
  existsActiveAdmin(): Promise<boolean>;
}
