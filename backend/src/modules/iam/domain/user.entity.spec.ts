import { Email } from './email.vo';
import {
  LOCK_DURATION_MINUTES,
  MAX_FAILED_LOGINS,
  User,
  UserProps,
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

  it('no bloquea antes del quinto intento', () => {
    const user = makeUser();
    for (let i = 1; i < MAX_FAILED_LOGINS; i++) user.registerFailedLogin(NOW);
    expect(user.failedLogins).toBe(MAX_FAILED_LOGINS - 1);
    expect(user.isLockedAt(NOW)).toBe(false);
  });

  it('bloquea 15 minutos al quinto intento y reinicia el contador', () => {
    const user = makeUser({ failedLogins: MAX_FAILED_LOGINS - 1 });
    user.registerFailedLogin(NOW);
    expect(user.isLockedAt(NOW)).toBe(true);
    expect(user.lockedUntil).toEqual(
      new Date(NOW.getTime() + LOCK_DURATION_MINUTES * MINUTE),
    );
    expect(user.failedLogins).toBe(0);
  });

  it('calcula los segundos restantes, redondeando hacia arriba', () => {
    const user = makeUser({
      lockedUntil: new Date(NOW.getTime() + 1500),
    });
    expect(user.secondsUntilUnlock(NOW)).toBe(2);
    expect(makeUser().secondsUntilUnlock(NOW)).toBe(0);
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
