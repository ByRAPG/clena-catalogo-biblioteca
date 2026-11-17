import { cutOffSemantic } from './semantic-cutoff';

const hits = [0.9, 0.88, 0.85, 0.8].map((score, i) => ({ id: `w${i}`, score }));

describe('cutOffSemantic', () => {
  it('descarta todo si el mejor no llega al mínimo', () => {
    expect(
      cutOffSemantic(hits, { minSimilarity: 0.95, relativeCutoff: 1 }),
    ).toEqual([]);
  });

  it('aplica el mínimo absoluto', () => {
    const kept = cutOffSemantic(hits, {
      minSimilarity: 0.86,
      relativeCutoff: 1,
    });
    expect(kept.map((h) => h.id)).toEqual(['w0', 'w1']);
  });

  it('aplica el corte relativo al mejor', () => {
    const kept = cutOffSemantic(hits, {
      minSimilarity: 0,
      relativeCutoff: 0.06,
    });
    expect(kept.map((h) => h.id)).toEqual(['w0', 'w1', 'w2']);
  });

  it('con valores neutros conserva todo y acepta lista vacía', () => {
    const neutral = { minSimilarity: 0, relativeCutoff: 1 };
    expect(cutOffSemantic(hits, neutral)).toHaveLength(4);
    expect(cutOffSemantic([], neutral)).toEqual([]);
  });
});
