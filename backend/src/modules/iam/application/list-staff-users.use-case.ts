import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  UserRepository,
  UserSummary,
} from './ports/user.repository';

/** HU-18: lista las cuentas de personal y administradores. */
@Injectable()
export class ListStaffUsers {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  execute(): Promise<UserSummary[]> {
    return this.users.listStaff();
  }
}
