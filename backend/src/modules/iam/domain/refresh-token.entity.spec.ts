import { RefreshToken } from './refresh-token.entity';

const NOW = new Date('2026-11-12T15:00:00.000Z');

const makeToken = (revokedAt: Date | null, expiresAt: Date) =>
  new RefreshToken({
    id: 't1',
    userId: 'u1',
    tokenHash: 'h',
    familyId: 'f1',
    expiresAt,
    revokedAt,
  });

describe('RefreshToken', () => {
  it('sabe si está revocado', () => {
    const future = new Date(NOW.getTime() + 1000);
    expect(makeToken(null, future).isRevoked()).toBe(false);
    expect(makeToken(NOW, future).isRevoked()).toBe(true);
  });

  it('expira en el instante de su fecha de vencimiento', () => {
    expect(makeToken(null, new Date(NOW.getTime() + 1)).isExpired(NOW)).toBe(
      false,
    );
    expect(makeToken(null, NOW).isExpired(NOW)).toBe(true);
  });
});
