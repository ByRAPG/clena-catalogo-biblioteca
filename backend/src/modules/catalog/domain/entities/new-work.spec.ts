import { InvalidWorkError } from '../errors/invalid-work.error';
import { NewWork } from './new-work';

const YEAR = 2026;

const fieldOf = (fn: () => unknown): string | undefined => {
  try {
    fn();
  } catch (error) {
    if (error instanceof InvalidWorkError) return error.field;
    throw error;
  }
  return undefined;
};

describe('NewWork', () => {
  it('crea la obra con los datos limpios', () => {
    const work = NewWork.create(
      {
        title: '  Cien   años de soledad ',
        authors: [' Gabriel García Márquez '],
        subjects: ['Realismo mágico'],
        categoryId: 'cat-1',
        year: 1967,
      },
      YEAR,
    );
    expect(work.title).toBe('Cien años de soledad');
    expect(work.authors).toEqual(['Gabriel García Márquez']);
    expect(work.subjects).toEqual(['Realismo mágico']);
    expect(work.categoryId).toBe('cat-1');
    expect(work.year).toBe(1967);
  });

  it('usa null y lista vacía para lo opcional', () => {
    const work = NewWork.create({ title: 'T', authors: ['A'] }, YEAR);
    expect(work.subjects).toEqual([]);
    expect(work.categoryId).toBeNull();
    expect(work.year).toBeNull();
  });

  it('rechaza el título vacío con el campo title', () => {
    expect(
      fieldOf(() => NewWork.create({ title: '   ', authors: ['A'] }, YEAR)),
    ).toBe('title');
  });

  it('rechaza la obra sin autores con el campo authors', () => {
    expect(
      fieldOf(() => NewWork.create({ title: 'T', authors: [] }, YEAR)),
    ).toBe('authors');
    expect(
      fieldOf(() => NewWork.create({ title: 'T', authors: ['  '] }, YEAR)),
    ).toBe('authors');
  });

  it('une autores y temas repetidos con otra escritura y conserva el orden', () => {
    const work = NewWork.create(
      {
        title: 'T',
        authors: [
          'Isabel Allende',
          'Gabriel García Márquez',
          'gabriel garcia marquez',
        ],
        subjects: ['Historia', 'HISTORIA', ''],
      },
      YEAR,
    );
    expect(work.authors).toEqual(['Isabel Allende', 'Gabriel García Márquez']);
    expect(work.subjects).toEqual(['Historia']);
  });

  it.each([0, -5, 1967.5, YEAR + 2])('rechaza el año %p', (year) => {
    expect(
      fieldOf(() => NewWork.create({ title: 'T', authors: ['A'], year }, YEAR)),
    ).toBe('year');
  });

  it('acepta el año siguiente (libros por publicar)', () => {
    expect(
      NewWork.create({ title: 'T', authors: ['A'], year: YEAR + 1 }, YEAR).year,
    ).toBe(YEAR + 1);
  });
});
