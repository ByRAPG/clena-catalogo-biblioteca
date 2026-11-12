import { Email } from './email.vo';
import { Role } from './role';

export const MAX_FAILED_LOGINS = 5;
export const LOCK_DURATION_MINUTES = 15;
const MS_PER_MINUTE = 60_000;

export interface UserProps {
  id: string;
  email: Email;
  passwordHash: string;
  fullName: string;
  role: Role;
  active: boolean;
  failedLogins: number;
  lockedUntil: Date | null;
  anonymizedAt: Date | null;
}

export class User {
  readonly id: string;
  readonly email: Email;
  readonly passwordHash: string;
  readonly fullName: string;
  readonly role: Role;
  private readonly active: boolean;
  private readonly anonymizedAt: Date | null;
  private failedLoginCount: number;
  private lockedUntilDate: Date | null;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.fullName = props.fullName;
    this.role = props.role;
    this.active = props.active;
    this.anonymizedAt = props.anonymizedAt;
    this.failedLoginCount = props.failedLogins;
    this.lockedUntilDate = props.lockedUntil;
  }

  get failedLogins(): number {
    return this.failedLoginCount;
  }

  get lockedUntil(): Date | null {
    return this.lockedUntilDate;
  }

  /** Una cuenta desactivada o anonimizada (HU-17) ya no puede entrar. */
  canLogin(): boolean {
    return this.active && this.anonymizedAt === null;
  }

  isLockedAt(now: Date): boolean {
    return this.lockedUntilDate !== null && this.lockedUntilDate > now;
  }

  /** Segundos que faltan para el desbloqueo, redondeados hacia arriba. */
  secondsUntilUnlock(now: Date): number {
    if (!this.isLockedAt(now) || this.lockedUntilDate === null) return 0;
    return Math.ceil((this.lockedUntilDate.getTime() - now.getTime()) / 1000);
  }

  /**
   * Regla de bloqueo: al llegar al quinto intento fallido la cuenta se bloquea
   * 15 minutos y el contador vuelve a cero, así al terminar el bloqueo
   * hay cinco intentos nuevos.
   */
  registerFailedLogin(now: Date): void {
    this.failedLoginCount += 1;
    if (this.failedLoginCount >= MAX_FAILED_LOGINS) {
      this.lockedUntilDate = new Date(
        now.getTime() + LOCK_DURATION_MINUTES * MS_PER_MINUTE,
      );
      this.failedLoginCount = 0;
    }
  }

  /** Un ingreso correcto reinicia los intentos. */
  registerSuccessfulLogin(): void {
    this.failedLoginCount = 0;
    this.lockedUntilDate = null;
  }
}
