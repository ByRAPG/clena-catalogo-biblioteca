/**
 * Semáforo sin cola: `tryAcquire` devuelve la función que libera el cupo o
 * `null` si ya están todos ocupados (quien llama degrada en vez de esperar).
 */
export class ConcurrencyLimiter {
  private active = 0;

  constructor(private readonly max: number) {}

  tryAcquire(): (() => void) | null {
    if (this.active >= this.max) return null;
    this.active += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.active -= 1;
    };
  }

  get inUse(): number {
    return this.active;
  }
}
