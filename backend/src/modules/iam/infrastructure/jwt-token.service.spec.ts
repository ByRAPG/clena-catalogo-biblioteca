import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from './jwt-token.service';

const DAY = 24 * 60 * 60 * 1000;
// Secretos inventados solo para las pruebas.
const SETTINGS: Record<string, string> = {
  JWT_ACCESS_SECRET: 'secreto-de-acceso-solo-para-pruebas',
  JWT_ACCESS_TTL: '15m',
  JWT_REFRESH_SECRET: 'secreto-de-renovacion-solo-para-pruebas',
  JWT_REFRESH_TTL: '7d',
};

const makeService = () =>
  new JwtTokenService(new JwtService(), {
    get: (key: string) => SETTINGS[key],
  } as unknown as ConfigService<never, true>);

describe('JwtTokenService', () => {
  it('firma y verifica el access token con usuario y rol', async () => {
    const service = makeService();
    const token = await service.signAccessToken({
      userId: 'user-1',
      role: 'ADMIN',
    });
    await expect(service.verifyAccessToken(token)).resolves.toEqual({
      userId: 'user-1',
      role: 'ADMIN',
    });
  });

  it('rechaza un access token alterado o ajeno', async () => {
    const service = makeService();
    const token = await service.signAccessToken({
      userId: 'user-1',
      role: 'ADMIN',
    });
    await expect(service.verifyAccessToken(`${token}x`)).resolves.toBeNull();
    await expect(service.verifyAccessToken('no-es-un-jwt')).resolves.toBeNull();
  });

  it('un refresh token no sirve como access token', async () => {
    const service = makeService();
    const refresh = await service.signRefreshToken({
      userId: 'user-1',
      familyId: 'fam-1',
    });
    await expect(service.verifyAccessToken(refresh.token)).resolves.toBeNull();
  });

  it('firma el refresh token con su familia y 7 días de vigencia', async () => {
    const service = makeService();
    const issued = await service.signRefreshToken({
      userId: 'user-1',
      familyId: 'fam-1',
    });

    await expect(service.verifyRefreshToken(issued.token)).resolves.toEqual({
      userId: 'user-1',
      familyId: 'fam-1',
    });
    const expected = Date.now() + 7 * DAY;
    expect(Math.abs(issued.expiresAt.getTime() - expected)).toBeLessThan(5000);
  });

  it('dos refresh tokens del mismo usuario y familia son distintos', async () => {
    const service = makeService();
    const claims = { userId: 'user-1', familyId: 'fam-1' };
    const first = await service.signRefreshToken(claims);
    const second = await service.signRefreshToken(claims);
    expect(first.token).not.toBe(second.token);
  });

  it('un access token no sirve como refresh token', async () => {
    const service = makeService();
    const access = await service.signAccessToken({
      userId: 'user-1',
      role: 'READER',
    });
    await expect(service.verifyRefreshToken(access)).resolves.toBeNull();
  });

  it('el hash es SHA-256 en hexadecimal y no contiene el token', () => {
    const service = makeService();
    const hash = service.hashRefreshToken('token-de-prueba');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(service.hashRefreshToken('token-de-prueba'));
    expect(hash).not.toContain('token-de-prueba');
  });
});
