import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../domain/role';
import { RolesGuard } from './roles.guard';

const contextWith = (auth?: { userId: string; role: Role }) =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ auth }) }),
  }) as unknown as ExecutionContext;

// Reflector falso: devuelve los roles que declararía @Roles en la ruta.
const guardRequiring = (roles?: Role[]) =>
  new RolesGuard({
    getAllAndOverride: () => roles,
  } as unknown as Reflector);

describe('RolesGuard', () => {
  it('deja pasar si la ruta no declara roles', () => {
    const guard = guardRequiring(undefined);
    expect(
      guard.canActivate(contextWith({ userId: 'u', role: 'READER' })),
    ).toBe(true);
  });

  it.each<Role>(['STAFF', 'ADMIN'])('deja pasar al rol %s', (role) => {
    const guard = guardRequiring(['STAFF', 'ADMIN']);
    expect(guard.canActivate(contextWith({ userId: 'u', role }))).toBe(true);
  });

  it('responde 403 si el rol no está permitido', () => {
    const guard = guardRequiring(['STAFF', 'ADMIN']);
    expect(() =>
      guard.canActivate(contextWith({ userId: 'u', role: 'READER' })),
    ).toThrow(ForbiddenException);
  });

  it('responde 401 si no hay usuario autenticado', () => {
    const guard = guardRequiring(['ADMIN']);
    expect(() => guard.canActivate(contextWith(undefined))).toThrow(
      UnauthorizedException,
    );
  });
});
