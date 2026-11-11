import { WorkNotFoundError } from '../domain/search-errors';
import { WorkDetail } from '../domain/work-summary';
import { GetWorkDetail } from './get-work-detail.use-case';
import { ListSearchFilters } from './list-search-filters.use-case';
import { SearchRepository } from './ports/search.repository';
import { SearchWorks } from './search-works.use-case';

const fakeRepo = (
  overrides: Partial<SearchRepository> = {},
): SearchRepository => ({
  searchWorks: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  findWorkDetail: jest.fn().mockResolvedValue(null),
  listCategories: jest.fn().mockResolvedValue([]),
  listRooms: jest.fn().mockResolvedValue([]),
  ...overrides,
});

describe('SearchWorks', () => {
  it('envía criterios normalizados al repositorio y arma la meta', async () => {
    const repo = fakeRepo({
      searchWorks: jest.fn().mockResolvedValue({ items: [], total: 23 }),
    });
    const result = await new SearchWorks(repo).execute({
      q: 'SOLEDÁD',
      page: 2,
    });
    expect(repo.searchWorks).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'soledad', page: 2, pageSize: 10 }),
    );
    expect(result).toEqual({
      data: [],
      meta: { page: 2, pageSize: 10, total: 23 },
    });
  });

  it('propaga el error de criterios inválidos sin consultar', async () => {
    const repo = fakeRepo();
    await expect(
      new SearchWorks(repo).execute({ pageSize: 99 }),
    ).rejects.toThrow('pageSize');
    expect(repo.searchWorks).not.toHaveBeenCalled();
  });
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
