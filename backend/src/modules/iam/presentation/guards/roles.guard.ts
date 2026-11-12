import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../domain/role';
import { AuthenticatedRequest } from './jwt-auth.guard';
import { ROLES_KEY } from './roles.decorator';

/** Se usa después de JwtAuthGuard: `@UseGuards(JwtAuthGuard, RolesGuard)`. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    // Sin @Roles basta con haber iniciado sesión.
    if (!allowedRoles || allowedRoles.length === 0) return true;

    const { auth } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!auth) throw new UnauthorizedException('Debe iniciar sesión');
    if (!allowedRoles.includes(auth.role)) {
      throw new ForbiddenException('No tienes permiso para esta acción');
    }
    return true;
  }
}
