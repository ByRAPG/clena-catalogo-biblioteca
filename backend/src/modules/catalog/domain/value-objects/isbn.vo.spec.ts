import { ImportRowError } from '../errors/import-row-error';
import { Isbn } from './isbn.vo';

describe('Isbn', () => {
  it.each([
    ['9789990000016', '9789990000016'],
    ['978-999-000001-6', '9789990000016'],
    [' 978 999 000002 3 ', '9789990000023'],
    ['979-8-88645-174-0', '9798886451740'],
    ['0-306-40615-2', '0306406152'],
    ['0-8044-2957-x', '080442957X'],
    ['080442957X', '080442957X'],
  ])('valida y normaliza el ISBN %s a %s', (raw, expected) => {
    const isbn = Isbn.create(raw);

    expect(isbn.value).toBe(expected);
  });

  it('considera iguales el mismo ISBN con y sin guiones', () => {
    const withHyphens = Isbn.create('978-999-000001-6');
    const plain = Isbn.create('9789990000016');

    expect(withHyphens.equals(plain)).toBe(true);
  });

  it.each([
    '',
    '   ',
    '12345',
    '9789990000012', // dígito de control incorrecto (ISBN-13)
    '9779990000012', // prefijo distinto de 978/979
    '0-306-40615-3', // dígito de control incorrecto (ISBN-10)
    '080442957Y', // carácter inválido
    '-9789990000011', // prefijo de fórmula
    '=9789990000011', // prefijo de fórmula
    '9789990000011-', // guion final
    '978_999_000001_1', // separador no permitido
  ])('rechaza el ISBN inválido %s con error en el campo isbn', (raw) => {
    expect.assertions(2);

    try {
      Isbn.create(raw);
    } catch (error) {
      expect(error).toBeInstanceOf(ImportRowError);
      expect((error as ImportRowError).field).toBe('isbn');
    }
  });
});
