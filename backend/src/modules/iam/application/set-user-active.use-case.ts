import { Inject, Injectable } from '@nestjs/common';
import {
  CannotDeactivateSelfError,
  UserNotFoundError,
} from '../domain/iam-errors';
import { CLOCK, Clock } from './ports/clock';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepository,
} from './ports/refresh-token.repository';
import { USER_REPOSITORY, UserRepository } from './ports/user.repository';

export interface SetUserActiveInput {
  actorId: string;
  targetId: string;
  active: boolean;
}

/** HU-18: activa o desactiva una cuenta del personal. Desactivar cierra sus sesiones. */
@Injectable()
export class SetUserActive {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(input: SetUserActiveInput): Promise<void> {
    if (!input.active && input.actorId === input.targetId) {
      throw new CannotDeactivateSelfError();
    }
    const target = await this.users.findById(input.targetId);
    // Solo se gestionan cuentas del personal; un lector responde como inexistente.
    if (!target || target.role === 'READER') throw new UserNotFoundError();

    await this.users.setActive(target.id, input.active);
    if (!input.active) {
      await this.refreshTokens.revokeAllForUser(target.id, this.clock.now());
    }
  }
}
