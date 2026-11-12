import { Email } from '../domain/email.vo';
import {
  AccountLockedError,
  INVALID_CREDENTIALS_MESSAGE,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../domain/iam-errors';
import { RefreshToken } from '../domain/refresh-token.entity';
import { Role } from '../domain/role';
import { MAX_FAILED_LOGINS, User, UserProps } from '../domain/user.entity';
import { LoginUser } from './login-user.use-case';
import { LogoutUser } from './logout-user.use-case';
import { Clock } from './ports/clock';
import {
  NewRefreshToken,
  RefreshTokenRepository,
} from './ports/refresh-token.repository';
import {
  IssuedRefreshToken,
  RefreshTokenClaims,
  TokenService,
} from './ports/token-service';
import { UserRepository } from './ports/user.repository';
import { RefreshSession } from './refresh-session.use-case';

const NOW = new Date('2026-11-12T15:00:00.000Z');
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
// Contraseña inventada solo para las pruebas.
const PASSWORD = 'clave-de-prueba';

// --- Puertos falsos (en memoria) ---------------------------------------

class FakeClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return this.current;
  }

  advance(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds);
  }
}

class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  add(user: User): void {
    this.users.set(user.id, user);
  }

  findByEmail(email: Email): Promise<User | null> {
    const found = [...this.users.values()].find((u) => u.email.equals(email));
    return Promise.resolve(found ?? null);
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  save(user: User): Promise<void> {
    this.users.set(user.id, user);
    return Promise.resolve();
  }
}

class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  private readonly rows: {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    revokedAt: Date | null;
  }[] = [];

  create(token: NewRefreshToken): Promise<void> {
    this.rows.push({
      ...token,
      id: `rt-${this.rows.length + 1}`,
      revokedAt: null,
    });
    return Promise.resolve();
  }

  findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = this.rows.find((r) => r.tokenHash === tokenHash);
    return Promise.resolve(row ? new RefreshToken(row) : null);
  }

  revokeIfActive(id: string, revokedAt: Date): Promise<boolean> {
    const row = this.rows.find((r) => r.id === id);
    if (!row || row.revokedAt !== null) return Promise.resolve(false);
    row.revokedAt = revokedAt;
    return Promise.resolve(true);
  }

  revokeFamily(familyId: string, revokedAt: Date): Promise<void> {
    for (const row of this.rows) {
      if (row.familyId === familyId && row.revokedAt === null) {
        row.revokedAt = revokedAt;
      }
    }
    return Promise.resolve();
  }

  activeCount(): number {
    return this.rows.filter((r) => r.revokedAt === null).length;
  }
}

class FakeTokenService implements TokenService {
  private counter = 0;

  constructor(private readonly clock: Clock) {}

  signAccessToken(claims: { userId: string; role: Role }): Promise<string> {
    return Promise.resolve(`access|${claims.userId}|${claims.role}`);
  }

  signRefreshToken(claims: RefreshTokenClaims): Promise<IssuedRefreshToken> {
    this.counter += 1;
    return Promise.resolve({
      token: `refresh-${this.counter}|${claims.userId}|${claims.familyId}`,
      expiresAt: new Date(this.clock.now().getTime() + 7 * DAY),
    });
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenClaims | null> {
    const [prefix, userId, familyId] = token.split('|');
    if (!prefix?.startsWith('refresh-') || !userId || !familyId) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ userId, familyId });
  }

  hashRefreshToken(token: string): string {
    return `hash(${token})`;
  }
}

const makeHasher = () => ({
  verify: jest.fn((plain: string, hash: string) =>
    Promise.resolve(hash === `hashed:${plain}`),
  ),
});

const makeUser = (overrides: Partial<UserProps> = {}): User =>
  new User({
    id: 'user-1',
    email: Email.create('personal@example.org'),
    passwordHash: `hashed:${PASSWORD}`,
    fullName: 'Bibliotecaria de Demostración',
    role: 'STAFF',
    active: true,
    failedLogins: 0,
    lockedUntil: null,
    anonymizedAt: null,
    ...overrides,
  });

function setup(user: User = makeUser()) {
  const clock = new FakeClock(NOW);
  const users = new InMemoryUserRepository();
  users.add(user);
  const refreshTokens = new InMemoryRefreshTokenRepository();
  const hasher = makeHasher();
  const tokens = new FakeTokenService(clock);
  return {
    clock,
    users,
    refreshTokens,
    hasher,
    login: new LoginUser(users, refreshTokens, hasher, tokens, clock),
    refresh: new RefreshSession(users, refreshTokens, tokens, clock),
    logout: new LogoutUser(refreshTokens, tokens, clock),
  };
}

const credentials = { email: 'personal@example.org', password: PASSWORD };
const wrongCredentials = { ...credentials, password: 'otra-clave' };

// --- Criterio 1: ingreso válido según el rol ----------------------------

describe('LoginUser: credenciales válidas', () => {
  it.each<Role>(['ADMIN', 'STAFF', 'READER'])(
    'entra con rol %s y devuelve nombre, rol y tokens',
    async (role) => {
      const { login, refreshTokens } = setup(makeUser({ role }));

      const session = await login.execute(credentials);

      expect(session.user).toEqual({
        name: 'Bibliotecaria de Demostración',
        role,
      });
      expect(session.accessToken).toBe(`access|user-1|${role}`);
      expect(session.refreshTokenExpiresAt).toEqual(
        new Date(NOW.getTime() + 7 * DAY),
      );
      expect(refreshTokens.activeCount()).toBe(1);
    },
  );

  it('acepta el correo con mayúsculas y espacios', async () => {
    const { login } = setup();
    const session = await login.execute({
      ...credentials,
      email: '  PERSONAL@Example.org ',
    });
    expect(session.user.role).toBe('STAFF');
  });

  it('guarda solo el hash del refresh token', async () => {
    const { login, refreshTokens } = setup();
    const session = await login.execute(credentials);
    const stored = await refreshTokens.findByHash(
      `hash(${session.refreshToken})`,
    );
    expect(stored?.tokenHash).not.toBe(session.refreshToken);
  });

  it('un ingreso correcto reinicia los intentos fallidos', async () => {
    const user = makeUser({ failedLogins: 4 });
    const { login, users } = setup(user);
    await login.execute(credentials);
    expect((await users.findById('user-1'))?.failedLogins).toBe(0);
  });
});

// --- Criterio 2: contraseña incorrecta y bloqueo ------------------------

describe('LoginUser: contraseña incorrecta y bloqueo', () => {
  it('usa el mismo error genérico si falla la contraseña o el correo', async () => {
    const { login } = setup();

    const badPassword = await login.execute(wrongCredentials).catch((e) => e);
    const unknownEmail = await login
      .execute({ email: 'nadie@example.org', password: PASSWORD })
      .catch((e) => e);
    const malformedEmail = await login
      .execute({ email: 'no-es-correo', password: PASSWORD })
      .catch((e) => e);

    for (const error of [badPassword, unknownEmail, malformedEmail]) {
      expect(error).toBeInstanceOf(InvalidCredentialsError);
      expect(error.message).toBe(INVALID_CREDENTIALS_MESSAGE);
    }
  });

  it('rechaza una cuenta inactiva con el mismo error genérico', async () => {
    const { login } = setup(makeUser({ active: false }));
    await expect(login.execute(credentials)).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });

  it('los primeros cuatro intentos fallidos no bloquean', async () => {
    const { login, users } = setup();
    for (let i = 1; i < MAX_FAILED_LOGINS; i++) {
      await expect(login.execute(wrongCredentials)).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      );
    }
    const user = await users.findById('user-1');
    expect(user?.failedLogins).toBe(MAX_FAILED_LOGINS - 1);
    expect(user?.isLockedAt(NOW)).toBe(false);
  });

  it('bloquea 15 minutos al quinto intento fallido', async () => {
    const { login } = setup();
    for (let i = 1; i < MAX_FAILED_LOGINS; i++) {
      await login.execute(wrongCredentials).catch(() => undefined);
    }
    await expect(login.execute(wrongCredentials)).rejects.toMatchObject({
      name: 'AccountLockedError',
      retryAfterSeconds: 15 * 60,
    });
  });

  it('con la cuenta bloqueada no revisa la contraseña, ni la correcta', async () => {
    const { login, clock, hasher } = setup(
      makeUser({ lockedUntil: new Date(NOW.getTime() + 10 * MINUTE) }),
    );
    clock.advance(4 * MINUTE);

    await expect(login.execute(credentials)).rejects.toMatchObject({
      name: 'AccountLockedError',
      retryAfterSeconds: 6 * 60,
    });
    expect(hasher.verify).not.toHaveBeenCalled();
  });

  it('pasados los 15 minutos vuelve a dejar entrar', async () => {
    const { login, clock } = setup();
    for (let i = 0; i < MAX_FAILED_LOGINS; i++) {
      await login.execute(wrongCredentials).catch(() => undefined);
    }
    await expect(login.execute(credentials)).rejects.toBeInstanceOf(
      AccountLockedError,
    );

    clock.advance(15 * MINUTE);

    const session = await login.execute(credentials);
    expect(session.user.role).toBe('STAFF');
  });

  it('los intentos fallidos se cuentan desde el último ingreso correcto', async () => {
    const { login } = setup();
    for (let i = 1; i < MAX_FAILED_LOGINS; i++) {
      await login.execute(wrongCredentials).catch(() => undefined);
    }
    await login.execute(credentials);
    // Otros cuatro fallos no bloquean porque el contador se reinició.
    for (let i = 1; i < MAX_FAILED_LOGINS; i++) {
      await expect(login.execute(wrongCredentials)).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      );
    }
  });
});

// --- Criterio 3: renovar la sesión sin pedir la contraseña --------------

describe('RefreshSession', () => {
  it('a los 15 minutos renueva la sesión sin pedir la contraseña', async () => {
    const { login, refresh, clock, hasher } = setup();
    const first = await login.execute(credentials);

    clock.advance(15 * MINUTE);
    const renewed = await refresh.execute(first.refreshToken);

    expect(renewed.accessToken).toBe(first.accessToken);
    expect(renewed.user.role).toBe('STAFF');
    expect(renewed.refreshToken).not.toBe(first.refreshToken);
    // La contraseña solo se verificó en el login, no en la renovación.
    expect(hasher.verify).toHaveBeenCalledTimes(1);
  });

  it('rota el refresh token: el usado se revoca y el nuevo funciona', async () => {
    const { login, refresh, refreshTokens } = setup();
    const first = await login.execute(credentials);

    const second = await refresh.execute(first.refreshToken);
    expect(refreshTokens.activeCount()).toBe(1);

    await expect(refresh.execute(second.refreshToken)).resolves.toBeDefined();
  });

  it('si se reutiliza un token revocado, revoca toda la familia', async () => {
    const { login, refresh, refreshTokens } = setup();
    const first = await login.execute(credentials);
    const second = await refresh.execute(first.refreshToken);

    await expect(refresh.execute(first.refreshToken)).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );

    expect(refreshTokens.activeCount()).toBe(0);
    await expect(refresh.execute(second.refreshToken)).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
  });

  it('rechaza un token que no está firmado ni registrado', async () => {
    const { refresh } = setup();
    await expect(refresh.execute('basura')).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
    await expect(
      refresh.execute('refresh-9|user-1|familia-inventada'),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('rechaza el refresh token vencido a los 7 días', async () => {
    const { login, refresh, clock } = setup();
    const session = await login.execute(credentials);

    clock.advance(7 * DAY);

    await expect(refresh.execute(session.refreshToken)).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
  });

  it('cierra la familia si la cuenta se desactivó después del login', async () => {
    const { login, refresh, refreshTokens, users } = setup();
    const session = await login.execute(credentials);

    users.add(makeUser({ active: false }));

    await expect(refresh.execute(session.refreshToken)).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
    expect(refreshTokens.activeCount()).toBe(0);
  });

  it('trata como reutilización el token que otra petición ya usó', async () => {
    const { login, refresh, refreshTokens } = setup();
    const session = await login.execute(credentials);
    // Simula una petición simultánea que revocó el token justo antes.
    const original = refreshTokens.revokeIfActive.bind(refreshTokens);
    refreshTokens.revokeIfActive = async (id, at) => {
      await original(id, at);
      return false;
    };

    await expect(refresh.execute(session.refreshToken)).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
    expect(refreshTokens.activeCount()).toBe(0);
  });
});

// --- Criterio 4: cerrar sesión invalida el refresh ----------------------

describe('LogoutUser', () => {
  it('después de cerrar sesión el refresh ya no renueva', async () => {
    const { login, logout, refresh, refreshTokens } = setup();
    const session = await login.execute(credentials);

    await logout.execute(session.refreshToken);

    expect(refreshTokens.activeCount()).toBe(0);
    await expect(refresh.execute(session.refreshToken)).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
  });

  it('también invalida los tokens más nuevos de la misma sesión', async () => {
    const { login, logout, refresh } = setup();
    const first = await login.execute(credentials);
    const renewed = await refresh.execute(first.refreshToken);

    await logout.execute(renewed.refreshToken);

    await expect(refresh.execute(renewed.refreshToken)).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
  });

  it('no falla sin cookie o con un token desconocido', async () => {
    const { logout } = setup();
    await expect(logout.execute(undefined)).resolves.toBeUndefined();
    await expect(logout.execute('desconocido')).resolves.toBeUndefined();
  });
});
