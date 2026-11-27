import { Email } from './email.vo';
import { Role } from './role';

export const MAX_FAILED_LOGINS = 5;
export const LOCK_DURATION_MINUTES = 15;
const MS_PER_MINUTE = 60_000;

/** Hasta cuándo queda bloqueada una cuenta que se bloquea en `now`. */
export function lockExpiryFrom(now: Date): Date {
  return new Date(now.getTime() + LOCK_DURATION_MINUTES * MS_PER_MINUTE);
}

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

  get isActive(): boolean {
    return this.active;
  }

  isLockedAt(now: Date): boolean {
    return this.lockedUntilDate !== null && this.lockedUntilDate > now;
  }

  /** Un ingreso correcto reinicia los intentos. */
  registerSuccessfulLogin(): void {
    this.failedLoginCount = 0;
    this.lockedUntilDate = null;
  }
}
