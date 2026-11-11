import { InvalidSearchCriteriaError } from '../domain/search-errors';
import { buildSearchCriteria } from './search-criteria';

const UUID = '5b0f7d4e-1c1e-4a53-a3f1-0d7f4a2c9e11';

describe('buildSearchCriteria', () => {
  it('aplica valores por defecto', () => {
    expect(buildSearchCriteria({})).toEqual({
      query: null,
      categoryId: null,
      roomId: null,
      onlyAvailable: false,
      page: 1,
      pageSize: 10,
    });
  });

  it('normaliza q (tildes, mayúsculas, espacios)', () => {
    expect(buildSearchCriteria({ q: '  SOLEDÁD   ' }).query).toBe('soledad');
  });

  it('trata un q vacío como ausente', () => {
    expect(buildSearchCriteria({ q: '   ' }).query).toBeNull();
  });

  it('acepta filtros válidos', () => {
    const c = buildSearchCriteria({
      categoryId: UUID,
      roomId: UUID,
      available: true,
      page: 3,
      pageSize: 50,
    });
    expect(c).toMatchObject({
      categoryId: UUID,
      roomId: UUID,
      onlyAvailable: true,
      page: 3,
      pageSize: 50,
    });
  });

  it.each([
    [{ page: 0 }],
    [{ page: 1.5 }],
    [{ pageSize: 0 }],
    [{ pageSize: 51 }],
    [{ q: 'x'.repeat(101) }],
    [{ categoryId: 'no-es-uuid' }],
    [{ roomId: '123' }],
  ])('rechaza %j', (input) => {
    expect(() => buildSearchCriteria(input)).toThrow(
      InvalidSearchCriteriaError,
    );
  });
});
