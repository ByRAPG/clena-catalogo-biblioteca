import { WorkNotFoundError } from '../domain/search-errors';
import { WorkDetail } from '../domain/work-summary';
import { GetWorkDetail } from './get-work-detail.use-case';
import { ListSearchFilters } from './list-search-filters.use-case';
import { SearchRepository } from './ports/search.repository';

const fakeRepo = (
  overrides: Partial<SearchRepository> = {},
): SearchRepository => ({
  searchWorks: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  rankLexical: jest.fn().mockResolvedValue([]),
  findSummaries: jest.fn().mockResolvedValue([]),
  findWorkDetail: jest.fn().mockResolvedValue(null),
  listCategories: jest.fn().mockResolvedValue([]),
  listRooms: jest.fn().mockResolvedValue([]),
  ...overrides,
});

describe('GetWorkDetail', () => {
  it('devuelve el detalle', async () => {
    const detail = { id: 'x', title: 'T' } as WorkDetail;
    const repo = fakeRepo({
      findWorkDetail: jest.fn().mockResolvedValue(detail),
    });
    await expect(new GetWorkDetail(repo).execute('x')).resolves.toBe(detail);
  });

  it('lanza WorkNotFoundError si no existe', async () => {
    await expect(
      new GetWorkDetail(fakeRepo()).execute('x'),
    ).rejects.toBeInstanceOf(WorkNotFoundError);
  });
});

describe('ListSearchFilters', () => {
  it('delega categorías y salas en el repositorio', async () => {
    const repo = fakeRepo({
      listCategories: jest.fn().mockResolvedValue([{ id: '1', name: 'A' }]),
      listRooms: jest.fn().mockResolvedValue([{ id: '2', name: 'B' }]),
    });
    const uc = new ListSearchFilters(repo);
    await expect(uc.categories()).resolves.toEqual([{ id: '1', name: 'A' }]);
    await expect(uc.rooms()).resolves.toEqual([{ id: '2', name: 'B' }]);
  });
});
