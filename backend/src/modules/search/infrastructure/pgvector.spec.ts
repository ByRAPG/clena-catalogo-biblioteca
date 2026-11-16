import { toVectorLiteral } from './pgvector';

describe('toVectorLiteral', () => {
  it('serializa al formato de pgvector', () => {
    expect(toVectorLiteral([0.5, -1, 0], 3)).toBe('[0.5,-1,0]');
  });

  it('exige las dimensiones indicadas', () => {
    expect(() => toVectorLiteral([1, 2], 3)).toThrow('3 dimensiones');
  });

  it('por defecto exige 384 dimensiones', () => {
    expect(() => toVectorLiteral([1, 2, 3])).toThrow('384 dimensiones');
    expect(toVectorLiteral(new Array<number>(384).fill(0))).toMatch(
      /^\[0(,0){383}\]$/,
    );
  });

  it.each([NaN, Infinity, -Infinity])('rechaza %s', (bad) => {
    expect(() => toVectorLiteral([1, bad, 0], 3)).toThrow('finitos');
  });
});
