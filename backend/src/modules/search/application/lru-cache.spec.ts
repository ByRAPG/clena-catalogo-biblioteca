import { LruCache } from './lru-cache';

describe('LruCache', () => {
  it('devuelve lo guardado y undefined si no existe', () => {
    const cache = new LruCache<number>(2, 1000);
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
  });

  it('expulsa la entrada menos usada al superar el tamaño', () => {
    const cache = new LruCache<number>(2, 1000);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // a pasa a ser la más reciente
    cache.set('c', 3);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
    expect(cache.size).toBe(2);
  });

  it('descarta las entradas vencidas', () => {
    let now = 0;
    const cache = new LruCache<number>(5, 100, () => now);
    cache.set('a', 1);
    now = 99;
    expect(cache.get('a')).toBe(1);
    now = 100;
    expect(cache.get('a')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('con tamaño o vigencia 0 no guarda nada', () => {
    const noSize = new LruCache<number>(0, 1000);
    noSize.set('a', 1);
    expect(noSize.get('a')).toBeUndefined();
    const noTtl = new LruCache<number>(5, 0);
    noTtl.set('a', 1);
    expect(noTtl.get('a')).toBeUndefined();
  });
});
