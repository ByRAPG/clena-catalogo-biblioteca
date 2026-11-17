import { ConcurrencyLimiter } from './concurrency-limiter';

describe('ConcurrencyLimiter', () => {
  it('concede hasta el máximo y rechaza el resto sin encolar', () => {
    const limiter = new ConcurrencyLimiter(2);
    expect(limiter.tryAcquire()).not.toBeNull();
    expect(limiter.tryAcquire()).not.toBeNull();
    expect(limiter.tryAcquire()).toBeNull();
    expect(limiter.inUse).toBe(2);
  });

  it('liberar devuelve el cupo y es idempotente', () => {
    const limiter = new ConcurrencyLimiter(1);
    const release = limiter.tryAcquire();
    release?.();
    release?.();
    expect(limiter.inUse).toBe(0);
    expect(limiter.tryAcquire()).not.toBeNull();
  });
});
