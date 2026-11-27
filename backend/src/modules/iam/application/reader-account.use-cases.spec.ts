import { Email } from '../domain/email.vo';
import {
  AccountDeletionNotAllowedError,
  ActiveLoansError,
  EmailAlreadyRegisteredError,
  PrivacyNotAcceptedError,
  WeakPasswordError,
  WrongPasswordError,
} from '../domain/iam-errors';
import { PRIVACY_VERSION } from '../domain/privacy';
import { Role } from '../domain/role';
import { User } from '../domain/user.entity';
import { DeleteMyAccount } from './delete-my-account.use-case';
import type {
  AnonymizeResult,
  ReaderAccountRepository,
} from './ports/reader-account.repository';
import type { UserRepository } from './ports/user.repository';
import { RegisterReader } from './register-reader.use-case';

const NOW = new Date('2026-11-27T10:00:00Z');
const clock = { now: () => NOW };
const hasher = {
  hash: (p: string) => Promise.resolve(`hashed:${p}`),
  verify: (plain: string, hash: string) =>
    Promise.resolve(hash === `hashed:${plain}`),
};

function user(role: Role = 'READER'): User {
  return new User({
    id: 'u1',
    email: Email.create('lector@example.org'),
    passwordHash: 'hashed:una-clave-larga-1',
    fullName: 'Lector',
    role,
    active: true,
    failedLogins: 0,
    lockedUntil: null,
    anonymizedAt: null,
  });
}

function setup(
  existing: User | null = null,
  anonymize: AnonymizeResult = 'done',
) {
  const createReaderAccount = jest.fn(() => Promise.resolve());
  const anonymizeMock = jest.fn(() => Promise.resolve(anonymize));
  const accounts = {
    createReaderAccount,
    anonymize: anonymizeMock,
  } as unknown as ReaderAccountRepository;
  const users = {
    findByEmail: () => Promise.resolve(existing),
    findById: () => Promise.resolve(existing),
  } as unknown as UserRepository;
  return {
    createReaderAccount,
    anonymizeMock,
    register: new RegisterReader(users, accounts, hasher, clock),
    remove: new DeleteMyAccount(users, accounts, hasher, clock),
  };
}

const valid = {
  fullName: 'Carmen Pérez',
  email: 'Carmen@Example.org',
  password: 'una-clave-larga-1',
  acceptPrivacy: true,
};

describe('RegisterReader (HU-16)', () => {
  it('crea un lector con la fecha y la version del aviso aceptado', async () => {
    const { register, createReaderAccount } = setup();
    await register.execute(valid);
    const call = createReaderAccount.mock.calls[0] as unknown as [
      { user: User; privacyVersion: string; consentAt: Date },
    ];
    expect(call[0].user.role).toBe('READER');
    expect(call[0].user.email.value).toBe('carmen@example.org');
    expect(call[0].privacyVersion).toBe(PRIVACY_VERSION);
    expect(call[0].consentAt).toEqual(NOW);
  });

  it('exige aceptar el aviso de privacidad', async () => {
    const { register, createReaderAccount } = setup();
    await expect(
      register.execute({ ...valid, acceptPrivacy: false }),
    ).rejects.toBeInstanceOf(PrivacyNotAcceptedError);
    expect(createReaderAccount).not.toHaveBeenCalled();
  });

  it('aplica la politica de contrasenas', async () => {
    const { register } = setup();
    await expect(
      register.execute({ ...valid, password: 'corta' }),
    ).rejects.toBeInstanceOf(WeakPasswordError);
  });

  it('con un correo ya registrado responde igual y no crea nada', async () => {
    const { register, createReaderAccount } = setup(user());
    await expect(register.execute(valid)).resolves.toBeUndefined();
    expect(createReaderAccount).not.toHaveBeenCalled();
  });

  it('si otra peticion gana la carrera por el correo, tambien responde igual', async () => {
    const { register, createReaderAccount } = setup();
    createReaderAccount.mockRejectedValueOnce(
      new EmailAlreadyRegisteredError(),
    );
    await expect(register.execute(valid)).resolves.toBeUndefined();
  });
});

describe('DeleteMyAccount (HU-17)', () => {
  it('anonimiza con un correo no personal cuando la contrasena es correcta', async () => {
    const { remove, anonymizeMock } = setup(user());
    await remove.execute({ userId: 'u1', password: 'una-clave-larga-1' });
    const arg = (
      anonymizeMock.mock.calls[0] as unknown as [
        { anonymizedEmail: string; now: Date },
      ]
    )[0];
    expect(arg.anonymizedEmail).toMatch(/^eliminada-.+@anonimo\.invalid$/);
    expect(arg.anonymizedEmail).not.toContain('lector');
    expect(arg.now).toEqual(NOW);
  });

  it('rechaza una contrasena incorrecta sin anonimizar', async () => {
    const { remove, anonymizeMock } = setup(user());
    await expect(
      remove.execute({ userId: 'u1', password: 'otra-clave-larga-2' }),
    ).rejects.toBeInstanceOf(WrongPasswordError);
    expect(anonymizeMock).not.toHaveBeenCalled();
  });

  it('responde 409 si tiene un prestamo activo', async () => {
    const { remove } = setup(user(), 'has-active-loans');
    await expect(
      remove.execute({ userId: 'u1', password: 'una-clave-larga-1' }),
    ).rejects.toBeInstanceOf(ActiveLoansError);
  });

  it('el personal no elimina su cuenta por aqui', async () => {
    const { remove } = setup(user('STAFF'));
    await expect(
      remove.execute({ userId: 'u1', password: 'una-clave-larga-1' }),
    ).rejects.toBeInstanceOf(AccountDeletionNotAllowedError);
  });
});
