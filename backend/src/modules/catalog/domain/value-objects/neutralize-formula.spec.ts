import {
  neutralizeFormula,
  neutralizeOptionalFormula,
} from './neutralize-formula';

describe('neutralizeFormula', () => {
  it.each([
    ['=SUM(A1:A2)', "'=SUM(A1:A2)"],
    ['+CMD|" /C calc"!A0', '\'+CMD|" /C calc"!A0'],
    ['-2+3', "'-2+3"],
    ['@SUM(1+1)', "'@SUM(1+1)"],
    [
      '  =HYPERLINK("https://example.org")  ',
      '\'=HYPERLINK("https://example.org")',
    ],
    ['\t=1+1', "'=1+1"],
    ['\r+1+1', "'+1+1"],
  ])('neutraliza la fórmula %s', (input, expected) => {
    expect(neutralizeFormula(input)).toBe(expected);
  });

  it.each([
    ['Cien años de soledad', 'Cien años de soledad'],
    ['  N-01  ', 'N-01'],
    ['863.6', '863.6'],
    ['', ''],
    ['   ', ''],
  ])('conserva texto seguro %s', (input, expected) => {
    expect(neutralizeFormula(input)).toBe(expected);
  });

  it('es idempotente cuando recibe un valor ya neutralizado', () => {
    const once = neutralizeFormula('=SUM(1,2)');
    const twice = neutralizeFormula(once);

    expect(once).toBe("'=SUM(1,2)");
    expect(twice).toBe(once);
  });

  it('maneja valores opcionales vacíos y con fórmula', () => {
    expect(neutralizeOptionalFormula(undefined)).toBeUndefined();
    expect(neutralizeOptionalFormula('   ')).toBeUndefined();
    expect(neutralizeOptionalFormula('=Editorial')).toBe("'=Editorial");
    expect(neutralizeOptionalFormula('  Editorial Ejemplo  ')).toBe(
      'Editorial Ejemplo',
    );
  });
});
