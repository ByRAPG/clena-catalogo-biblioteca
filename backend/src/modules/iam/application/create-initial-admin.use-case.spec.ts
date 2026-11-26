import { Email } from '../domain/email.vo';
import {
  InvalidEmailError,
  InvalidFullNameError,
  WeakPasswordError,
} from '../domain/iam-errors';
import { User } from '../domain/user.entity';
import { CreateInitialAdmin } from './create-initial-admin.use-case';
import { UserRepository } from './ports/user.repository';

// Contraseña inventada solo para las pruebas.
const PASSWORD = 'una-clave-larga-de-prueba';

const makeUser = (email: string, role: User['role'], active = true): User =>
  new User({
    id: `id-${email}`,
    email: Email.create(email),
    passwordHash: 'hash-previo',
    fullName: 'Existente',
    role,
    active,
    failedLogins: 0,
    lockedUntil: null,
    anonymizedAt: null,
  });

function setup(existing: User[] = []) {
  const stored = new Map(existing.map((u) => [u.email.value, u]));
  const users: UserRepository = {
    findByEmail: (email) => Promise.resolve(stored.get(email.value) ?? null),
    findById: () => Promise.resolve(null),
    save: jest.fn(() => Promise.resolve()),
    incrementFailedLogins: jest.fn(() => Promise.resolve(0)),
    lockAccount: jest.fn(() => Promise.resolve()),
    create: jest.fn((user: User) => {
      stored.set(user.email.value, user);
      return Promise.resolve();
    }),
    existsActiveAdmin: () =>
      Promise.resolve(
        [...stored.values()].some((u) => u.role === 'ADMIN' && u.canLogin()),
      ),
  };
  const hasher = {
    hash: jest.fn((plain: string) => Promise.resolve(`hashed:${plain}`)),
    verify: jest.fn(),
  };
  return {
    useCase: new CreateInitialAdmin(users, hasher),
    users,
    hasher,
    stored,
  };
}

const input = {
  email: 'Admin@Example.org',
  password: PASSWORD,
  fullName: 'Administrador',
};

describe('CreateInitialAdmin', () => {
  it('crea un administrador activo con la contraseña hasheada', async () => {
    const { useCase, users, stored } = setup();

    const result = await useCase.execute(input);

    expect(result.status).toBe('created');
    const created = stored.get('admin@example.org');
    expect(created?.role).toBe('ADMIN');
    expect(created?.canLogin()).toBe(true);
    expect(created?.passwordHash).toBe(`hashed:${PASSWORD}`);
    expect(created?.passwordHash).not.toBe(PASSWORD);
    expect(users.create).toHaveBeenCalledTimes(1);
  });

  it('si el correo ya existe no cambia nada y lo informa', async () => {
    const previous = makeUser('admin@example.org', 'READER');
    const { useCase, users, hasher } = setup([previous]);

    const result = await useCase.execute(input);

    expect(result.status).toBe('already-exists');
    expect(users.create).not.toHaveBeenCalled();
    expect(users.save).not.toHaveBeenCalled();
    expect(hasher.hash).not.toHaveBeenCalled();
    expect(previous.role).toBe('READER');
    expect(previous.passwordHash).toBe('hash-previo');
  });

  it('el correo existente tiene prioridad aunque ya haya un administrador', async () => {
    const { useCase } = setup([makeUser('admin@example.org', 'ADMIN')]);
    expect((await useCase.execute(input)).status).toBe('already-exists');
  });

  it('rechaza un correo inválido', async () => {
    const { useCase, users } = setup();
    await expect(
      useCase.execute({ ...input, email: 'no-es-correo' }),
    ).rejects.toBeInstanceOf(InvalidEmailError);
    expect(users.create).not.toHaveBeenCalled();
  });

  it('rechaza una contraseña débil sin revelarla', async () => {
    const { useCase, users } = setup();
    const promise = useCase.execute({ ...input, password: 'corta' });
    await expect(promise).rejects.toBeInstanceOf(WeakPasswordError);
    await expect(promise).rejects.not.toThrow('corta');
    expect(users.create).not.toHaveBeenCalled();
  });

  it('rechaza una contraseña igual al correo', async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ ...input, password: 'admin@example.org' }),
    ).rejects.toBeInstanceOf(WeakPasswordError);
  });

  it('rechaza un nombre vacío', async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ ...input, fullName: '   ' }),
    ).rejects.toBeInstanceOf(InvalidFullNameError);
  });

  it('se niega si ya hay otro administrador activo', async () => {
    const { useCase, users } = setup([makeUser('otro@example.org', 'ADMIN')]);

    const result = await useCase.execute(input);

    expect(result.status).toBe('admin-present');
    expect(users.create).not.toHaveBeenCalled();
  });

  it('un administrador inactivo no bloquea la creación', async () => {
    const { useCase } = setup([makeUser('otro@example.org', 'ADMIN', false)]);
    expect((await useCase.execute(input)).status).toBe('created');
  });

  it('con allowAdditional crea otro administrador', async () => {
    const { useCase, stored } = setup([makeUser('otro@example.org', 'ADMIN')]);

    const result = await useCase.execute({ ...input, allowAdditional: true });

    expect(result.status).toBe('created');
    expect(stored.get('admin@example.org')?.role).toBe('ADMIN');
  });
});
