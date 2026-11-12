import { SetMetadata } from '@nestjs/common';
import { Role } from '../../domain/role';

export const ROLES_KEY = 'roles';

/** Roles que pueden entrar a la ruta, p. ej. `@Roles('STAFF', 'ADMIN')`. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
