import { fuseRrf, RRF_K } from './rrf';

describe('fuseRrf', () => {
  it('usa k = 60 por defecto', () => {
    expect(RRF_K).toBe(60);
    const [first] = fuseRrf([['a']]);
    expect(first.score).toBeCloseTo(1 / 61, 12);
  });

  it('suma las contribuciones de cada lista', () => {
    const fused = fuseRrf([
      ['a', 'b'],
      ['b', 'a'],
    ]);
    const expected = 1 / 61 + 1 / 62;
    expect(fused.map((f) => f.id)).toEqual(['a', 'b']);
    expect(fused[0].score).toBeCloseTo(expected, 12);
    expect(fused[1].score).toBeCloseTo(expected, 12);
  });

  it('sube lo que aparece en ambas listas', () => {
    const fused = fuseRrf([
      ['a', 'b', 'c'],
      ['d', 'c', 'e'],
    ]);
    expect(fused.map((f) => f.id)).toEqual(['c', 'a', 'd', 'b', 'e']);
  });

  it('desempata por id cuando todo lo demás es igual', () => {
    expect(fuseRrf([['b'], ['a']]).map((f) => f.id)).toEqual(['a', 'b']);
  });

  it('desempata por mejor posición antes que por id', () => {
    // Con k = 0: x = 1/1 + 1/3 = 1,33; z = 1/2 + 1/2 = 1; y = 1.
    // z e y empatan en puntuación; y tiene mejor posición (1.ª) y gana a z.
    const fused = fuseRrf(
      [
        ['x', 'z'],
        ['y', 'z', 'x'],
      ],
      0,
    );
    expect(fused.map((f) => f.id)).toEqual(['x', 'y', 'z']);
  });

  it('es determinista aunque cambie el orden de las listas', () => {
    const l1 = ['a', 'b', 'c'];
    const l2 = ['c', 'b', 'a'];
    expect(fuseRrf([l1, l2])).toEqual(fuseRrf([l2, l1]));
  });

  it('ignora repetidos dentro de una lista y acepta listas vacías', () => {
    expect(fuseRrf([['a', 'a', 'b'], []]).map((f) => f.id)).toEqual(['a', 'b']);
    expect(fuseRrf([])).toEqual([]);
    expect(fuseRrf([[], []])).toEqual([]);
  });
});
