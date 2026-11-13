import { NewWork } from '../../domain/entities/new-work';
import { InvalidWorkError } from '../../domain/errors/invalid-work.error';
import type { CatalogTermRepository } from '../ports/catalog-term.repository';
import type { WorkRegistrationRepository } from '../ports/work-registration.repository';
import { RegisterWorkUseCase } from './register-work.use-case';
import { SuggestCatalogTermsUseCase } from './suggest-catalog-terms.use-case';

const fakeWorks = (
  overrides: Partial<WorkRegistrationRepository> = {},
): jest.Mocked<WorkRegistrationRepository> =>
  ({
    categoryExists: jest.fn().mockResolvedValue(true),
    create: jest.fn().mockResolvedValue({ id: 'w1', title: 'T' }),
    ...overrides,
  }) as jest.Mocked<WorkRegistrationRepository>;

describe('RegisterWorkUseCase', () => {
  it('guarda la obra validada y devuelve su id', async () => {
    const works = fakeWorks();
    const result = await new RegisterWorkUseCase(works).execute(
      { title: ' T ', authors: ['A', 'a'], categoryId: 'c1', year: 2000 },
      2026,
    );
    expect(result).toEqual({ id: 'w1', title: 'T' });
    expect(works.categoryExists).toHaveBeenCalledWith('c1');
    const saved = works.create.mock.calls[0][0];
    expect(saved).toBeInstanceOf(NewWork);
    expect(saved.title).toBe('T');
    expect(saved.authors).toEqual(['A']);
  });

  it('no consulta la categoría si no viene', async () => {
    const works = fakeWorks();
    await new RegisterWorkUseCase(works).execute({
      title: 'T',
      authors: ['A'],
    });
    expect(works.categoryExists).not.toHaveBeenCalled();
    expect(works.create).toHaveBeenCalled();
  });

  it('rechaza una categoría inexistente sin guardar', async () => {
    const works = fakeWorks({
      categoryExists: jest.fn().mockResolvedValue(false),
    });
    await expect(
      new RegisterWorkUseCase(works).execute({
        title: 'T',
        authors: ['A'],
        categoryId: 'nope',
      }),
    ).rejects.toMatchObject({ field: 'categoryId' });
    expect(works.create).not.toHaveBeenCalled();
  });

  it('no guarda si falta el título', async () => {
    const works = fakeWorks();
    await expect(
      new RegisterWorkUseCase(works).execute({ title: '', authors: ['A'] }),
    ).rejects.toBeInstanceOf(InvalidWorkError);
    expect(works.create).not.toHaveBeenCalled();
  });
});

describe('SuggestCatalogTermsUseCase', () => {
  const fakeTerms = (): jest.Mocked<CatalogTermRepository> => ({
    suggest: jest
      .fn()
      .mockResolvedValue([{ id: 'a1', name: 'Gabriel García Márquez' }]),
  });

  it('busca con el texto normalizado y un límite', async () => {
    const terms = fakeTerms();
    const result = await new SuggestCatalogTermsUseCase(terms).execute(
      'authors',
      '  GARCÍA ',
    );
    expect(terms.suggest).toHaveBeenCalledWith('authors', 'garcia', 8);
    expect(result).toEqual([{ id: 'a1', name: 'Gabriel García Márquez' }]);
  });

  it('no consulta con menos de 2 letras', async () => {
    const terms = fakeTerms();
    await expect(
      new SuggestCatalogTermsUseCase(terms).execute('subjects', ' h '),
    ).resolves.toEqual([]);
    expect(terms.suggest).not.toHaveBeenCalled();
  });
});
