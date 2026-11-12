export interface RefreshTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  /** Todos los tokens que nacen de un mismo login comparten familia. */
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

/** Registro de un refresh token; nunca guarda el token en claro, solo su hash. */
export class RefreshToken {
  readonly id: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly familyId: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;

  constructor(props: RefreshTokenProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tokenHash = props.tokenHash;
    this.familyId = props.familyId;
    this.expiresAt = props.expiresAt;
    this.revokedAt = props.revokedAt;
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  isExpired(now: Date): boolean {
    return this.expiresAt <= now;
  }
}
