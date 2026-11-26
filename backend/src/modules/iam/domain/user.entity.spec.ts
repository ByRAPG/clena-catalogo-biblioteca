import { Email } from './email.vo';
import {
  LOCK_DURATION_MINUTES,
  MAX_FAILED_LOGINS,
  User,
  UserProps,
  lockExpiryFrom,
} from './user.entity';

const NOW = new Date('2026-11-12T15:00:00.000Z');
const MINUTE = 60_000;

const makeUser = (overrides: Partial<UserProps> = {}): User =>
  new User({
    id: 'user-1',
    email: Email.create('personal@example.org'),
    passwordHash: 'hash',
    fullName: 'Bibliotecaria de Demostración',
    role: 'STAFF',
    active: true,
    failedLogins: 0,
    lockedUntil: null,
    anonymizedAt: null,
    ...overrides,
  });

describe('User: bloqueo por intentos fallidos', () => {
  it('el enunciado fija 5 intentos y 15 minutos', () => {
    expect(MAX_FAILED_LOGINS).toBe(5);
    expect(LOCK_DURATION_MINUTES).toBe(15);
  });

  it('el bloqueo dura 15 minutos desde el momento en que se aplica', () => {
    expect(lockExpiryFrom(NOW)).toEqual(
      new Date(NOW.getTime() + LOCK_DURATION_MINUTES * MINUTE),
    );
  });

  it('se desbloquea cuando pasa el tiempo', () => {
    const user = makeUser({ lockedUntil: new Date(NOW.getTime() + MINUTE) });
    expect(user.isLockedAt(NOW)).toBe(true);
    expect(user.isLockedAt(new Date(NOW.getTime() + MINUTE))).toBe(false);
  });

  it('un ingreso correcto reinicia intentos y bloqueo', () => {
    const user = makeUser({
      failedLogins: 3,
      lockedUntil: new Date(NOW.getTime() - MINUTE),
    });
    user.registerSuccessfulLogin();
    expect(user.failedLogins).toBe(0);
    expect(user.lockedUntil).toBeNull();
  });
});

describe('User.canLogin', () => {
  it('permite entrar a una cuenta activa', () => {
    expect(makeUser().canLogin()).toBe(true);
  });

  it('no permite entrar a una cuenta inactiva o anonimizada', () => {
    expect(makeUser({ active: false }).canLogin()).toBe(false);
    expect(makeUser({ anonymizedAt: NOW }).canLogin()).toBe(false);
  });
});
