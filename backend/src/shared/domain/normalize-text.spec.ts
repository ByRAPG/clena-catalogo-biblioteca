import { normalizeText } from './normalize-text';

describe('normalizeText', () => {
  it('quita tildes y pasa a minúsculas', () => {
    expect(normalizeText('Cien Años de Soledad')).toBe('cien anos de soledad');
    expect(normalizeText('SOLEDÁD')).toBe('soledad');
    expect(normalizeText('García Márquez')).toBe('garcia marquez');
  });

  it('colapsa espacios y recorta', () => {
    expect(normalizeText('  Historia   del  Caribe ')).toBe(
      'historia del caribe',
    );
  });

  it('trata el indicador ordinal como unaccent', () => {
    expect(normalizeText('n.º 1')).toBe('n.o 1');
  });

  it('es idempotente', () => {
    const once = normalizeText('Doña Bárbara');
    expect(normalizeText(once)).toBe(once);
  });
});
