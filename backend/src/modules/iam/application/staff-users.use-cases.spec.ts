import { Email } from '../domain/email.vo';
import {
  CannotDeactivateSelfError,
  EmailAlreadyRegisteredError,
  UserNotFoundError,
  WeakPasswordError,
} from '../domain/iam-errors';
import { Role } from '../domain/role';
import { User } from '../domain/user.entity';
import { CreateStaffUser } from './create-staff-user.use-case';
import { SetUserActive } from './set-user-active.use-case';
import type { UserRepository } from './ports/user.repository';
import type { RefreshTokenRepository } from './ports/refresh-token.repository';

const NOW = new Date('2026-11-26T12:00:00Z');

function user(id: string, role: Role, email = `${id}@example.org`): User {
  return new User({
    id,
    email: Email.create(email),
    passwordHash: 'h',
    fullName: id,
    role,
    active: true,
    failedLogins: 0,
    lockedUntil: null,
    anonymizedAt: null,
  });
}

function setup(existing: User[] = []) {
  const stored = new Map(existing.map((u) => [u.id, u]));
  const create = jest.fn((u: User) => {
    stored.set(u.id, u);
    return Promise.resolve();
  });
  const setActive = jest.fn(() => Promise.resolve());
  const users = {
    findByEmail: (email: Email) =>
      Promise.resolve(
        [...stored.values()].find((u) => u.email.equals(email)) ?? null,
      ),
    findById: (id: string) => Promise.resolve(stored.get(id) ?? null),
    create,
    setActive,
  } as unknown as UserRepository;
  const revokeAllForUser = jest.fn(() => Promise.resolve());
  const tokens = { revokeAllForUser } as unknown as RefreshTokenRepository;
  const hasher = {
    hash: (p: string) => Promise.resolve(`hashed:${p}`),
    verify: () => Promise.resolve(true),
  };
  return {
    create,
    setActive,
    revokeAllForUser,
    createStaff: new CreateStaffUser(users, hasher),
    setUserActive: new SetUserActive(users, tokens, { now: () => NOW }),
  };
}

describe('CreateStaffUser', () => {
  it('crea una cuenta STAFF activa con la contraseña cifrada', async () => {
    const { createStaff, create } = setup();
    await createStaff.execute({
      fullName: '  Marta   Pérez ',
      email: 'Marta@Example.org',
      password: 'una-clave-larga-1',
    });
    const created = create.mock.calls[0][0];
    expect(created.role).toBe('STAFF');
    expect(created.fullName).toBe('Marta Pérez');
    expect(created.email.value).toBe('marta@example.org');
    expect(created.passwordHash).toBe('hashed:una-clave-larga-1');
    expect(created.canLogin()).toBe(true);
  });

  it('rechaza una contraseña que no cumple la política', async () => {
    const { createStaff, create } = setup();
    await expect(
      createStaff.execute({
        fullName: 'Marta',
        email: 'marta@example.org',
        password: 'corta',
      }),
    ).rejects.toBeInstanceOf(WeakPasswordError);
    expect(create).not.toHaveBeenCalled();
  });

  it('rechaza un correo ya registrado', async () => {
    const { createStaff } = setup([user('a', 'STAFF', 'marta@example.org')]);
    await expect(
      createStaff.execute({
        fullName: 'Marta',
        email: 'marta@example.org',
        password: 'una-clave-larga-1',
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);
  });
});

describe('SetUserActive', () => {
  it('desactivar revoca los refresh tokens de la cuenta', async () => {
    const { setUserActive, setActive, revokeAllForUser } = setup([
      user('staff', 'STAFF'),
    ]);
    await setUserActive.execute({
      actorId: 'admin',
      targetId: 'staff',
      active: false,
    });
    expect(setActive).toHaveBeenCalledWith('staff', false);
    expect(revokeAllForUser).toHaveBeenCalledWith('staff', NOW);
  });

  it('activar no revoca nada', async () => {
    const { setUserActive, setActive, revokeAllForUser } = setup([
      user('staff', 'STAFF'),
    ]);
    await setUserActive.execute({
      actorId: 'admin',
      targetId: 'staff',
      active: true,
    });
    expect(setActive).toHaveBeenCalledWith('staff', true);
    expect(revokeAllForUser).not.toHaveBeenCalled();
  });

  it('un administrador no puede desactivarse a sí mismo', async () => {
    const { setUserActive, setActive } = setup([user('admin', 'ADMIN')]);
    await expect(
      setUserActive.execute({
        actorId: 'admin',
        targetId: 'admin',
        active: false,
      }),
    ).rejects.toBeInstanceOf(CannotDeactivateSelfError);
    expect(setActive).not.toHaveBeenCalled();
  });

  it('no gestiona lectores ni cuentas inexistentes', async () => {
    const { setUserActive } = setup([user('lector', 'READER')]);
    for (const targetId of ['lector', 'nadie']) {
      await expect(
        setUserActive.execute({ actorId: 'admin', targetId, active: false }),
      ).rejects.toBeInstanceOf(UserNotFoundError);
    }
  });
});
